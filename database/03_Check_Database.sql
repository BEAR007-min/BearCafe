USE [BearCafeDb];
GO

-- Table and column definitions
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE,
       CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = N'dbo'
  AND TABLE_NAME IN (N'Categories', N'Products', N'Orders', N'OrderItems')
ORDER BY TABLE_NAME, ORDINAL_POSITION;
GO

-- Current row counts
SELECT N'Categories' AS TableName, COUNT_BIG(*) AS RowCount FROM dbo.Categories
UNION ALL SELECT N'Products', COUNT_BIG(*) FROM dbo.Products
UNION ALL SELECT N'Orders', COUNT_BIG(*) FROM dbo.Orders
UNION ALL SELECT N'OrderItems', COUNT_BIG(*) FROM dbo.OrderItems;
GO

-- Recent orders with their detail lines
SELECT TOP (20)
    o.Id AS OrderId, o.Status, o.PaymentStatus, o.TotalAmount, o.CreatedAt,
    oi.Id AS OrderItemId, oi.ProductId, p.Name AS ProductName,
    oi.Quantity, oi.UnitPrice, oi.SubTotal
FROM dbo.Orders AS o
LEFT JOIN dbo.OrderItems AS oi ON oi.OrderId = o.Id
LEFT JOIN dbo.Products AS p ON p.Id = oi.ProductId
ORDER BY o.Id DESC, oi.Id;
GO
