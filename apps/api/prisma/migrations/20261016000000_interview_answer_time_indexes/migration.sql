-- Per-user answer counts (monthly quota, progress) and recently served
-- questions filter a user's session questions by time; without these the
-- planner falls back to scanning the whole table for heavy users.

-- CreateIndex
CREATE INDEX "InterviewSessionQuestion_sessionId_answeredAt_idx" ON "InterviewSessionQuestion"("sessionId", "answeredAt");

-- CreateIndex
CREATE INDEX "InterviewSessionQuestion_sessionId_createdAt_idx" ON "InterviewSessionQuestion"("sessionId", "createdAt");
