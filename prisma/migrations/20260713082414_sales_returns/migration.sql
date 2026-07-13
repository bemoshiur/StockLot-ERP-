-- CreateTable
CREATE TABLE "SalesReturn" (
    "id" TEXT NOT NULL,
    "challanId" TEXT NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "periodMonth" TEXT NOT NULL,
    "reason" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnLine" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "styleId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "lineAmount" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "ReturnLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesReturn_challanId_idx" ON "SalesReturn"("challanId");

-- CreateIndex
CREATE INDEX "SalesReturn_periodMonth_idx" ON "SalesReturn"("periodMonth");

-- CreateIndex
CREATE INDEX "ReturnLine_returnId_idx" ON "ReturnLine"("returnId");

-- CreateIndex
CREATE INDEX "ReturnLine_styleId_idx" ON "ReturnLine"("styleId");

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_challanId_fkey" FOREIGN KEY ("challanId") REFERENCES "SalesChallan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnLine" ADD CONSTRAINT "ReturnLine_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "SalesReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnLine" ADD CONSTRAINT "ReturnLine_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "ProductStyle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
