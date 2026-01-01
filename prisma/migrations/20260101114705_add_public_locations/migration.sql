-- CreateTable
CREATE TABLE "PublicLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "PublicLocation_type_idx" ON "PublicLocation"("type");

-- CreateIndex
CREATE INDEX "PublicLocation_isActive_idx" ON "PublicLocation"("isActive");
