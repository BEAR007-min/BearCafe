/*
    BearCafe database bootstrap script.
    - Safe for an existing database: creates the database only if it does not exist.
    - Creates each table only when that table is missing.
    - Does NOT drop tables, delete rows, or alter an existing table.
    Run in SSMS while connected to the intended SQL Server instance.
*/

USE [master];
GO

IF DB_ID(N'BearCafeDb') IS NULL
BEGIN
    CREATE DATABASE [BearCafeDb];
    PRINT N'Database BearCafeDb created.';
END
ELSE
BEGIN
    PRINT N'Database BearCafeDb already exists. Existing data and tables will be preserved.';
END;
GO

USE [BearCafeDb];
GO

IF OBJECT_ID(N'dbo.Categories', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Categories
    (
        Id          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Categories PRIMARY KEY,
        Name        NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500) NULL,
        IsActive    BIT NOT NULL CONSTRAINT DF_Categories_IsActive DEFAULT (1)
    );
    PRINT N'Table Categories created.';
END;
GO

IF OBJECT_ID(N'dbo.Products', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Products
    (
        Id          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Products PRIMARY KEY,
        Name        NVARCHAR(150) NOT NULL,
        Description NVARCHAR(1000) NULL,
        Price       DECIMAL(18,2) NOT NULL,
        ImageUrl    NVARCHAR(500) NULL,
        IsAvailable BIT NOT NULL CONSTRAINT DF_Products_IsAvailable DEFAULT (1),
        CategoryId  INT NOT NULL,
        CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryId)
            REFERENCES dbo.Categories(Id) ON DELETE NO ACTION,
        CONSTRAINT CK_Products_Price_NonNegative CHECK (Price >= 0)
    );
    CREATE INDEX IX_Products_CategoryId ON dbo.Products(CategoryId);
    PRINT N'Table Products created.';
END;
GO

IF OBJECT_ID(N'dbo.Orders', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Orders
    (
        Id            INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Orders PRIMARY KEY,
        CustomerId    INT NULL,
        Status        NVARCHAR(30) NOT NULL CONSTRAINT DF_Orders_Status DEFAULT (N'Pending'),
        PaymentStatus NVARCHAR(30) NOT NULL CONSTRAINT DF_Orders_PaymentStatus DEFAULT (N'Unpaid'),
        TotalAmount   DECIMAL(18,2) NOT NULL,
        CreatedAt     DATETIME2 NOT NULL CONSTRAINT DF_Orders_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT CK_Orders_TotalAmount_NonNegative CHECK (TotalAmount >= 0)
    );
    CREATE INDEX IX_Orders_CreatedAt ON dbo.Orders(CreatedAt DESC);
    PRINT N'Table Orders created.';
END;
GO

IF OBJECT_ID(N'dbo.OrderItems', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OrderItems
    (
        Id        INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_OrderItems PRIMARY KEY,
        OrderId   INT NOT NULL,
        ProductId INT NOT NULL,
        Quantity  INT NOT NULL,
        UnitPrice DECIMAL(18,2) NOT NULL,
        SubTotal  DECIMAL(18,2) NOT NULL,
        CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderId)
            REFERENCES dbo.Orders(Id) ON DELETE CASCADE,
        CONSTRAINT FK_OrderItems_Products FOREIGN KEY (ProductId)
            REFERENCES dbo.Products(Id) ON DELETE NO ACTION,
        CONSTRAINT CK_OrderItems_Quantity_Positive CHECK (Quantity > 0),
        CONSTRAINT CK_OrderItems_UnitPrice_NonNegative CHECK (UnitPrice >= 0),
        CONSTRAINT CK_OrderItems_SubTotal_NonNegative CHECK (SubTotal >= 0)
    );
    CREATE INDEX IX_OrderItems_OrderId ON dbo.OrderItems(OrderId);
    CREATE INDEX IX_OrderItems_ProductId ON dbo.OrderItems(ProductId);
    PRINT N'Table OrderItems created.';
END;
GO

PRINT N'BearCafe database bootstrap finished.';
GO
