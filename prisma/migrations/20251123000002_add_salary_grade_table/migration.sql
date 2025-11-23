-- CreateTable
CREATE TABLE "salary_grades" (
    "id" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "monthlyRate" DECIMAL(10,2) NOT NULL,
    "dailyRate" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_grades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "salary_grades_grade_key" ON "salary_grades"("grade");

-- CreateIndex
CREATE UNIQUE INDEX "salary_grades_position_rank_key" ON "salary_grades"("position", "rank");

-- CreateIndex
CREATE INDEX "salary_grades_position_idx" ON "salary_grades"("position");

-- CreateIndex
CREATE INDEX "salary_grades_grade_idx" ON "salary_grades"("grade");
