import type { AttachmentPipelineResult } from "./types";

type AttachmentEventBase = {
  fileName: string;
  fileSize: number;
  mimeType: string;
  occurredAt: string;
};

type AttachmentEventPayload =
  | {
      type: "attachmentUploaded";
      bucket: string;
      storagePath: string;
    }
  | {
      type: "attachmentQueued";
    }
  | {
      type: "extractionStarted";
    }
  | {
      type: "extractionCompleted";
      extractionStatus: AttachmentPipelineResult["extractionStatus"];
      extractionTruncated: boolean;
      hasExtractedText: boolean;
      pipelineStatus: AttachmentPipelineResult["pipelineStatus"];
    }
  | {
      type: "extractionFailed";
      extractionDetail: AttachmentPipelineResult["extractionDetail"];
      extractionError: AttachmentPipelineResult["extractionError"];
      pipelineStatus: "failed";
    }
  | {
      type: "attachmentIndexed";
      indexId?: string;
    };

export type AttachmentPipelineEvent = AttachmentEventBase & AttachmentEventPayload;

export type AttachmentPipelineEventHandler = (
  event: AttachmentPipelineEvent
) => void | Promise<void>;

export type AttachmentPipelineEventType = AttachmentPipelineEvent["type"];

function createEventBase(file: File): AttachmentEventBase {
  return {
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    occurredAt: new Date().toISOString(),
  };
}

export function createAttachmentEvent(
  file: File,
  event: AttachmentEventPayload
): AttachmentPipelineEvent {
  return {
    ...createEventBase(file),
    ...event,
  };
}

export async function emitAttachmentEvent(
  handler: AttachmentPipelineEventHandler | undefined,
  event: AttachmentPipelineEvent
) {
  if (!handler) return;

  await handler(event);
}
