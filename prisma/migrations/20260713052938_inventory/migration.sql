-- CreateTable
CREATE TABLE "PurchaseReceipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challanNo" TEXT,
    "receiptDate" DATETIME NOT NULL,
    "periodMonth" TEXT NOT NULL,
    "supplierId" TEXT,
    "isOpeningStock" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseReceipt_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReceiptLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receiptId" TEXT NOT NULL,
    "styleId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "subCategoryNote" TEXT,
    CONSTRAINT "ReceiptLine_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "PurchaseReceipt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReceiptLine_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "ProductStyle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PurchaseReceipt_periodMonth_idx" ON "PurchaseReceipt"("periodMonth");

-- CreateIndex
CREATE INDEX "PurchaseReceipt_receiptDate_idx" ON "PurchaseReceipt"("receiptDate");

-- CreateIndex
CREATE INDEX "ReceiptLine_receiptId_idx" ON "ReceiptLine"("receiptId");

-- CreateIndex
CREATE INDEX "ReceiptLine_styleId_idx" ON "ReceiptLine"("styleId");
