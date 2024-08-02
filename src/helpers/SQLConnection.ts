import * as sql from 'mssql';

const year = new Date().getFullYear();

const config: sql.config = {
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	server: process.env.DB_SERVER,
	database: process.env.DB_DATABASE + year,
	options: {
		encrypt: false,
		trustServerCertificate: true,
	},
};

async function getUserIdData(customerPhone: string) {
	try {
		const pool = await sql.connect(config);

		const result = await pool
			.request()
			.input('cleanPhone', sql.NVarChar(50), customerPhone).query(`
				SELECT CustomerId
        		FROM dbo.Currents
        		WHERE REPLACE(REPLACE(REPLACE(REPLACE(Tel,'-',''),' ',''),')',''),'(','') = @cleanPhone
          `);

		await sql.close();

		return result.recordset;
	} catch (err) {
		await sql.close();
		return `Hata: ${err}`;
	}
}

async function getUserIdData2(customerPhone: string) {
	try {
		const pool = await sql.connect(config);

		const result = await pool
			.request()
			.input('customerPhone', sql.NVarChar(50), customerPhone).query(`
			SELECT COUNT(CustomerId) AS PhoneCount FROM 
			(SELECT CustomerId, REPLACE(REPLACE(REPLACE(Replace(Tel,'-',''),' ',''),')',''),'(','') 
			AS TelNoClean FROM dbo.Currents WHERE Tel IS NOT NULL) AS PERSONLIST
			WHERE PERSONLIST.TelNoClean = @customerPhone
            `);

		await sql.close();
		return result.recordset;
	} catch (err) {
		await sql.close();
		return `Hata: ${err}`;
	}
}

async function getUserInformation(customerId: string) {
	try {
		const pool = await sql.connect(config);

		const result = await pool
			.request()
			.input('customerId', sql.NVarChar(50), customerId).query(`
				SELECT CustomerName AS [AD SOYAD], TaxNumber AS [TC KİMLİK], CONVERT(varchar, DateBirth,104) AS [DOĞUM TARİHİ], FatherName AS [BABA ADI] FROM Currents WHERE CustomerId = @customerId;
            `);

		await sql.close();
		return result.recordset;
	} catch (err) {
		await sql.close();
		return `Hata: ${err}`;
	}
}

async function getProducerReceiptList(customerId: string) {
	try {
		const pool = await sql.connect(config);

		const result = await pool
			.request()
			.input('customerId', sql.NVarChar(50), customerId).query(`
				SELECT Ettn as ETTN, DocumentId as [BELGE NO], NetQuantity as [NET MİKTAR], UnitPrice as [BİRİM FİYAT], NetAmount as [NET TUTAR], CONVERT(varchar, DocuemntDate, 104) AS [DOKÜMAN TARİHİ]
				FROM FarmerMovents WHERE CurrentID = @customerId;
            `);

		await sql.close();
		return result.recordset;
	} catch (err) {
		await sql.close();
		return `Hata: ${err}`;
	}
}

//Toplan Satılan Çay Miktarı Sorgusu
async function getTotalTeaSold(customerId: string) {
	try {
		const pool = await sql.connect(config);

		const result = await pool
			.request()
			.input('customerId', sql.NVarChar(50), customerId).query(`
				SELECT 
    			'Tarafınızdan satın alınan toplam yaş çay miktarı *' + FORMAT(SUM([NetQuantity]), '#,##0.00', 'tr-TR') + '* kilogramdır.' AS FormattedText
				FROM CurrentDetails CD 
				LEFT JOIN CurrentMasters CM ON CM.ID = CD.MasterID 
				LEFT JOIN FarmerMovents FM ON FM.CurrentId = @customerId AND FM.DocumentID = CM.DocumentID
				WHERE CD.AccountID = @customerId
            `);
		await sql.close();
		return result.recordset;
	} catch (err) {
		await sql.close();
		return `Hata: ${err}`;
	}
}

//Kalan Alacak Bakiyesi Sorgusu
async function getRemainingReceivableBalance(customerId: string) {
	try {
		const pool = await sql.connect(config);

		const result = await pool
			.request()
			.input('customerId', sql.NVarChar(50), customerId).query(`
				SELECT CASE 
    			WHEN SUM(COALESCE([Net Tutar] + [ÖDENEN],0)) > 0 THEN FORMAT(SUM([Net Tutar] - [ÖDENEN]), '#,##0.00', 'tr-TR') + ' TL ALACAK BAKİYESİ BULUNMAKTADIR.'
    			WHEN SUM(COALESCE([Net Tutar] + [ÖDENEN],0)) < 0 THEN FORMAT(SUM([Net Tutar] - [ÖDENEN]), '#,##0.00', 'tr-TR') + ' TL BORÇ BAKİYESİ BULUNMAKTADIR.'
    			WHEN SUM(COALESCE([Net Tutar] + [ÖDENEN],0)) = 0 THEN '0 TL BORÇ/ALACAK BAKİYESİ BULUNMAMAKTADIR.'
				END AS BAKIYEDURUM
				FROM (
				    SELECT 
				        CD.Credit AS [Net Tutar], 
				        CD.Debit AS [ÖDENEN]  
				    FROM CurrentDetails CD 
				    LEFT JOIN CurrentMasters CM ON CM.ID = CD.MasterID 
				    WHERE CD.AccountID = @customerId
				) AS DIPTOPLAM;
            `);
		console.log(result);
		await sql.close();
		return result.recordset;
	} catch (err) {
		await sql.close();
		return `Hata: ${err}`;
	}
}

async function getCurrentAccountStatement(customerId: string) {
	try {
		const pool = await sql.connect(config);

		const result = await pool
			.request()
			.input('customerId', sql.NVarChar(50), customerId).query(`
				SELECT CONVERT(varchar, Tarih, 104) AS [TARİH], [Alım Yeri Adı] AS [ALIM YERİ], [Ödeme Adı] AS [ALIM PLANI], [Belge No] AS [EVRAK NO], [Birim Fiyat] AS [BRÜT FİYAT], [Net Miktar] AS [MİKTAR (KG)],
				[Net Tutar] AS TUTAR, [ÖDENEN], ID AS [MID], 
				SUM(COALESCE([Net Tutar]-[ÖDENEN], 0)) OVER (ORDER BY Tarih, ID ASC) AS KALAN
				FROM (
				select CM.Date AS Tarih, W.WareHouseName AS [Alım Yeri Adı], CM.ID,  PP.PaymentName AS [Ödeme Adı], CM.DocumentID AS [Belge No], CM.PaymentUnitPrice As [Birim Fiyat],
				FM.NetQuantity AS [Net Miktar], CD.Credit AS [Net Tutar], CD.Debit AS [ÖDENEN]  from 
				CurrentDetails CD 
				LEFT JOIN CurrentMasters CM ON CM.ID = CD.MasterID 
				LEFT JOIN PaymentPlans PP ON PP.PaymentID=CM.PaymentID AND PP.BranchID=CM.BranchID
				LEFT JOIN WareHouses W ON W.WarehouseID=CM.WarehouseID AND W.BranchID=CM.BranchID AND W.CompanyID=CM.CompanyID
				LEFT JOIN FarmerMovents FM ON FM.CurrentId = @customerId AND FM.DocumentID = CM.DocumentID
				where CD.AccountID = @customerId
				) X ORDER BY Tarih, ID ASC
            `);
		await sql.close();
		return result.recordset.sort((a, b) => {
			const [dayA, monthA, yearA] = a.TARİH.split('.');
			const [dayB, monthB, yearB] = b.TARİH.split('.');
			const dateA = new Date(`${yearA}-${monthA}-${dayA}`);
			const dateB = new Date(`${yearB}-${monthB}-${dayB}`);
			return dateA.getTime() - dateB.getTime();
		});
	} catch (err) {
		await sql.close();
		return `Hata: ${err}`;
	}
}

async function getPaymentsMade(customerId: string) {
	try {
		const pool = await sql.connect(config);

		const result = await pool
			.request()
			.input('customerId', sql.NVarChar(50), customerId).query(`
				Select CONVERT(varchar,CM.Date,104) AS TARİH, PP.PaymentName AS [ÖDEME ADI], CM.DocumentID AS [BELGE NO], CD.Debit AS [ÖDENEN], CD.AccountId  from 
				CurrentDetails CD 
				LEFT JOIN CurrentMasters CM ON CM.ID = CD.MasterID 
				LEFT JOIN PaymentPlans PP ON PP.PaymentID=CM.PaymentID AND PP.BranchID=CM.BranchID
				where CD.AccountID = @customerId AND CD.Debit > 0
            `);
		await sql.close();
		return result.recordset;
	} catch (err) {
		await sql.close();
		return `Hata: ${err}`;
	}
}

export {
	getUserIdData,
	getUserIdData2,
	getUserInformation,
	getProducerReceiptList,
	getTotalTeaSold,
	getRemainingReceivableBalance,
	getCurrentAccountStatement,
	getPaymentsMade,
};
