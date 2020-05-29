const cassandra = require('cassandra-driver');

console.log('\t\tInicializando conexão com o banco de dados - Cassandra\n\n');

var PlainTextAuthProvider = cassandra.auth.PlainTextAuthProvider;
const client = new cassandra.Client({
    contactPoints: ['127.0.0.1:9042'],
    authProvider: new PlainTextAuthProvider('cassandra', 'cassandra'),
    localDataCenter: 'datacenter1',
    keyspace: 'bank'
});


function Helper(query, params) {
    this.query = query;
    this.params = params;
}

Helper.prototype.executeQuery = function (query, params) {
    Helper.call(this, query, params);

    client.execute(this.query, this.params, { prepare: true })
        .then(_ => { },
            err => {
                console.log(`erro efetuar query: ${err}`);
            });
}

Helper.prototype.findTransactions = function (account) {
    const query = 'SELECT transactions FROM accounts WHERE agency = ? AND accountNumber = ?';
    /* params = account */ 
    console.log(`Valor\t|Tipo`);
    client.eachRow(query, account, { prepare: true },
        (n, row) => {
            if (row.transactions) {
                for (const transactions of row.transactions) {
                    console.log(`R$ ${transactions.value} \t|${transactions.type}`);
                }
            }
        }, (err) => {
            if (err) {
                console.log(`erro efetuar consulta: ${err}`);
            }
        });
}

Helper.prototype.findLoans = function (query, params) {
    console.log(`Parcela\t|Valor\t|Parcela paga?`);
    client.eachRow(query, params, { prepare: true },
        (n, row) => {
            console.log(row.parcelnumber + "\t|R$ " + row.parcelvalue + "\t|" + row.parcelpaid);
        }, (err) => {
            if (err) {
                console.log(`erro efetuar consulta: ${err}`);
            }
        });
}

function Account(agency, accountNumber) {
    this.agency = agency;
    this.accountNumber = accountNumber;
    this.accountInfo = `Agência: ${this.agency} Conta: ${accountNumber}`;
}

function Transaction(account, value, type) {
    Account.call(this, account.agency, account.accountNumber);
    this.value = value;
    this.type = type;
}


Transaction.prototype.createTransaction = function (account, value, type) {
    if (!account.agency) {
        throw "Agência inválida";
    }
    if (!account.accountNumber) {
        throw "Número da conta inválida";
    }
    if (!value && value <= 0) {
        throw "Valor inválido";
    }

    const params = {
        agency: account.agency,
        accountNumber: account.accountNumber,
        transactions: [{
            type: type,
            value: value
        }]
    };

    let helper = new Helper();
    const sql = 'UPDATE accounts SET  transactions = transactions + ? where agency=? and accountnumber=?';

    helper.executeQuery(sql, params);
}

Transaction.prototype.createCredit = function (account, value) {
    console.log(`Criando transação de crédito: ${account.accountInfo} - Valor R$ ${value}\n`);
    this.createTransaction(account, value, 'C');
}

Transaction.prototype.createDebit = function (account, value) {
    console.log(`Criando transação de débito: ${account.accountInfo} - Valor R$ ${value}\n`);    
    this.createTransaction(account, value, 'D');
}

Account.prototype.findExtract = function () {
    console.log(`Listando movimentaçoes: ${this.accountInfo}`);
    const helper = new Helper();
    helper.findTransactions(this);
}

/* Funções disponíveis no projeto */

// Inicializa classes
const account = new Account(1, 1);
const transations = new Transaction(account);

// - Efetuar crédito
//  transations.createCredit(account, 100);

// - Efetuar débito
// transations.createDebit(account, 10);

// - Visualizar extrato
account.findExtract();

function registerLoan(agency, accountNumber, loanValue, parcelNumbers) {
    if (!agency) {
        throw "Agência inválida";
    }
    if (!accountNumber) {
        throw "Número da conta inválida";
    }
    if (!parcelNumbers && parcelNumbers <= 0) {
        throw "Número de parcelas inválido";
    }
    if (!loanValue && loanValue <= 0) {
        throw "Valor do empréstimo inválido";
    }

    const parcelValue = (loanValue / parcelNumbers);

    for (let index = 1; index <= parcelNumbers; index++) {
        let params = {
            agency: agency,
            accountNumber: accountNumber,
            parcelNumber: index,
            parcelValue: parcelValue,
            parcelPaid: 'N'
        };

        let helper = new Helper();
        let sql = 'INSERT INTO loans (agency, accountNumber, parcelNumber, parcelValue, parcelPaid) VALUES (?, ?, ?, ?,?)';

        console.log(`Registrando parcela do empréstimo da conta: ${agency}-${accountNumber} - Parcela ${index} - Valor R$ ${parcelValue}`);
        helper.executeQuery(sql, params);
    }

    console.log(`Empréstimo efetuado com sucesso`);
}

function payParcel(agency, accountNumber, parcelNumber) {
    if (!agency) {
        throw "Agência inválida";
    }
    if (!accountNumber) {
        throw "Número da conta inválida";
    }
    if (!parcelNumber && parcelNumber <= 0) {
        throw "Número da parcela inválido";
    }


    let params = {
        agency: agency,
        accountNumber: accountNumber,
        parcelNumber: parcelNumber,
    };

    let helper = new Helper();
    let sql = "UPDATE loans SET parcelPaid='S' WHERE agency=? and accountNumber=? and parcelNumber=?";

    console.log(`Registrando pagamento da parcela  ${agency}-${accountNumber} - Parcela ${parcelNumber}`);
    helper.executeQuery(sql, params);

    console.log(`Parcela paga com sucesso`);
}

function payParcelsNotPaid(agency, accountNumber) {
    console.log(`Registrando pagamento do empréstimo da conta ${agency}-${accountNumber}\n`);

    if (!agency) {
        throw "Agência inválida";
    }
    if (!accountNumber) {
        throw "Número da conta inválida";
    }

    const params = {
        agency: agency,
        accountNumber: accountNumber,
    };

    let helper = new Helper();
    const query = "SELECT agency, accountnumber, parcelnumber FROM loans WHERE agency = ? AND accountNumber = ? and parcelPaid='N' ALLOW FILTERING";

    client.eachRow(query, params, { prepare: true },
        (n, row) => {
            payParcel(row.agency, row.accountnumber, row.parcelnumber);
        }, (err) => {
            if (err) {
                return console.log(`erro efetuar consulta: ${err}`);
            }
            return console.log(`Empréstimo quitado com sucesso`);
        });
}

function extractLoan(agency, accountNumber) {
    if (!agency) {
        throw "Agência inválida";
    }
    if (!accountNumber) {
        throw "Número da conta inválida";
    }

    const params = {
        agency: agency,
        accountNumber: accountNumber,
    };

    let helper = new Helper();
    const sql = 'SELECT parcelNumber, parcelValue, parcelPaid FROM loans WHERE agency = ? AND accountNumber = ?';

    console.log(`Listando empréstimos da conta: ${agency}-${accountNumber}`);
    helper.findLoans(sql, params);

}

// - Registrar empréstimo
// registerLoan(1, 3, 300, 5);

// - Efetuar pagamento de uma parcela
// payParcel(1, 1, 1);

// - Efetuar pagamento do empréstimo
// payParcelsNotPaid(1, 2);

// - Visualizar extrato do empréstimo
// extractLoan(1, 3);