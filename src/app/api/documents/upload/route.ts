import { withAuth, json } from "@/lib/api/handler";
import { ApiValidationError } from "@/lib/auth/rbac";
import { documentUploadMetaSchema } from "@/lib/api/schemas";
import { createSupabaseServiceServer } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { approximateTokenCount, chunkText, extractTextFromFile, inferDocumentType, placeholderEmbedding, validateDocumentFile } from "@/lib/documents";
import { assertIncidentInOrganization } from "@/lib/auth/tenant";
import { executeWorkflowsForTrigger } from "@/lib/services/workflow-automation-service";

export const POST = withAuth("incidents:create", async (request, { user }) => {
  const form = await request.formData();
  const fileInput = form.get("file");
  if (!(fileInput instanceof File)) {
    throw new ApiValidationError("'file' is required as multipart file field.");
  }
  const validation = validateDocumentFile(fileInput);
  if (!validation.valid) {
    throw new ApiValidationError(validation.error);
  }

  const parsedMetaResult = documentUploadMetaSchema.safeParse({
    incidentId: form.get("incidentId")?.toString() || undefined,
    organizationId: form.get("organizationId")?.toString() || undefined,
  });
  if (!parsedMetaResult.success) {
    throw new ApiValidationError(parsedMetaResult.error.issues.map((issue) => issue.message).join("; "));
  }
  const parsedMeta = parsedMetaResult.data;
  if (parsedMeta.incidentId) {
    await assertIncidentInOrganization(parsedMeta.incidentId, user.organizationId);
  }

  const supabase = createSupabaseServiceServer();
  if (!supabase) {
    return json(
      {
        error:
          "Supabase Storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      },
      500
    );
  }

  const safeName = fileInput.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${Date.now()}-${safeName}`;
  const upload = await supabase.storage.from("documents").upload(path, fileInput, {
    upsert: false,
    contentType: fileInput.type || "application/octet-stream",
  });

  if (upload.error) {
    await prisma.auditLog.create({
      data: {
        incidentId: parsedMeta.incidentId,
        organizationId: parsedMeta.organizationId ?? user.organizationId,
        actorType: "user",
        actorId: user.id,
        action: "document_upload_failed",
        detailsJson: {
          fileName: fileInput.name,
          reason: upload.error.message,
        },
      },
    });
    return json({ error: `Storage upload failed: ${upload.error.message}` }, 500);
  }

  const { data: publicUrlData } = supabase.storage.from("documents").getPublicUrl(path);
  const extracted = await extractTextFromFile(fileInput);
  const chunks = chunkText(extracted.text);

  const embeddingKeyAvailable = Boolean(process.env.OPENAI_API_KEY || process.env.AIML_API_KEY);

  const document = await prisma.document.create({
    data: {
      incidentId: parsedMeta.incidentId,
      organizationId: parsedMeta.organizationId ?? user.organizationId,
      uploadedBy: user.id,
      name: fileInput.name,
      mimeType: fileInput.type || "application/octet-stream",
      type: inferDocumentType(fileInput.name, fileInput.type || ""),
      sizeBytes: fileInput.size,
      storagePath: path,
      publicUrl: publicUrlData.publicUrl,
      textContent: extracted.text || null,
      metadataJson: {
        extractionMethod: extracted.method,
        chunkCount: chunks.length,
        embeddingMode: embeddingKeyAvailable ? "placeholder_until_provider_wired" : "placeholder_no_embedding_key",
      },
    },
  });

  if (chunks.length > 0) {
    await prisma.documentChunk.createMany({
      data: chunks.map((content, chunkIndex) => ({
        documentId: document.id,
        chunkIndex,
        content,
        tokenCount: approximateTokenCount(content),
        embeddingJson: placeholderEmbedding(content),
      })),
    });
  }

  await prisma.auditLog.create({
    data: {
      incidentId: parsedMeta.incidentId,
      organizationId: parsedMeta.organizationId ?? user.organizationId,
      actorType: "user",
      actorId: user.id,
      action: "document_uploaded",
      detailsJson: {
        documentId: document.id,
        name: document.name,
        chunkCount: chunks.length,
      },
    },
  });

  await executeWorkflowsForTrigger({
    organizationId: parsedMeta.organizationId ?? user.organizationId,
    triggerType: "NEW_DOCUMENT_UPLOAD",
    incidentId: parsedMeta.incidentId,
    payload: {
      documentId: document.id,
      incidentId: parsedMeta.incidentId,
      name: document.name,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      chunkCount: chunks.length,
    },
  });

  return json({ documentId: document.id, chunkCount: chunks.length }, 201);
});
