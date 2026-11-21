/*
    Optional sample data for a NEW/demo database only.
    Inserts records only when the same category/product name is not already present.
    Does not delete or overwrite existing records.
*/
USE [BearCafeDb];
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Categories WHERE LTRIM(RTRIM(Name)) = N'Cafe Pha máy')
    INSERT INTO dbo.Categories (Name, Description, IsActive)
    VALUES (N'Cafe Pha máy', N'Espresso, Americano, Cappuccino, Latte, Mocha', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.Categories WHERE LTRIM(RTRIM(Name)) = N'Trà')
    INSERT INTO dbo.Categories (Name, Description, IsActive)
    VALUES (N'Trà', N'Trà trái cây, trà sữa và trà pha chế', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.Categories WHERE LTRIM(RTRIM(Name)) = N'Nước suối')
    INSERT INTO dbo.Categories (Name, Description, IsActive)
    VALUES (N'Nước suối', NULL, 1);

IF NOT EXISTS (SELECT 1 FROM dbo.Categories WHERE LTRIM(RTRIM(Name)) = N'Nước ngọt')
    INSERT INTO dbo.Categories (Name, Description, IsActive)
    VALUES (N'Nước ngọt', NULL, 1);

IF NOT EXISTS (SELECT 1 FROM dbo.Categories WHERE LTRIM(RTRIM(Name)) = N'Bánh')
    INSERT INTO dbo.Categories (Name, Description, IsActive)
    VALUES (N'Bánh', N'Bánh ngọt và bánh mì', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.Categories WHERE LTRIM(RTRIM(Name)) = N'cafe truyền thống')
    INSERT INTO dbo.Categories (Name, Description, IsActive)
    VALUES (N'cafe truyền thống', N'Cà phê đen và cà phê sữa nóng/đá', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.Categories WHERE LTRIM(RTRIM(Name)) = N'Nước ép, Sinh tố')
    INSERT INTO dbo.Categories (Name, Description, IsActive)
    VALUES (N'Nước ép, Sinh tố', N'Nước ép trái cây và sinh tố', 1);
GO

DECLARE @TraditionalCoffeeCategoryId INT;
SELECT TOP (1) @TraditionalCoffeeCategoryId = Id
FROM dbo.Categories
WHERE LTRIM(RTRIM(Name)) = N'cafe truyền thống'
ORDER BY Id;

IF @TraditionalCoffeeCategoryId IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.Products WHERE Name = N'Cafe đen')
BEGIN
    INSERT INTO dbo.Products (Name, Description, Price, ImageUrl, IsAvailable, CategoryId)
    VALUES (N'Cafe đen', NULL, 20000.00, NULL, 1, @TraditionalCoffeeCategoryId);
END;
GO

PRINT N'Demo seed data checked/inserted.';
GO
