-- AlterTable
ALTER TABLE "ProductStyle" ADD COLUMN     "reorderLevel" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "StockAdjustment" (
    "id" TEXT NOT NULL,
    "styleId" TEXT NOT NULL,
    "adjustmentDate" TIMESTAMP(3) NOT NULL,
    "periodMonth" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseReturn" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "periodMonth" TEXT NOT NULL,
    "reason" TEXT,
    "creditAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseReturnLine" (
    "id" TEXT NOT NULL,
    "purchaseReturnId" TEXT NOT NULL,
    "styleId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "lineAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "PurchaseReturnLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockAdjustment_styleId_idx" ON "StockAdjustment"("styleId");

-- CreateIndex
CREATE INDEX "StockAdjustment_periodMonth_idx" ON "StockAdjustment"("periodMonth");

-- CreateIndex
CREATE INDEX "PurchaseReturn_supplierId_idx" ON "PurchaseReturn"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseReturn_periodMonth_idx" ON "PurchaseReturn"("periodMonth");

-- CreateIndex
CREATE INDEX "PurchaseReturnLine_purchaseReturnId_idx" ON "PurchaseReturnLine"("purchaseReturnId");

-- CreateIndex
CREATE INDEX "PurchaseReturnLine_styleId_idx" ON "PurchaseReturnLine"("styleId");

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "ProductStyle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturn" ADD CONSTRAINT "PurchaseReturn_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturnLine" ADD CONSTRAINT "PurchaseReturnLine_purchaseReturnId_fkey" FOREIGN KEY ("purchaseReturnId") REFERENCES "PurchaseReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturnLine" ADD CONSTRAINT "PurchaseReturnLine_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "ProductStyle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
