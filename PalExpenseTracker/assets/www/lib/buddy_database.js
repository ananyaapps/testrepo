/**
 * 
 */
function buddyDatabase(shortName, version, maxSize, error_handler) {
	this.db = openDatabase(shortName, version, shortName, maxSize);
	this.db
	.transaction(function(transaction) {
		transaction
		.executeSql('CREATE TABLE IF NOT EXISTS buddies '
				+ ' (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, '
				+ ' name STRING NOT NULL, number TEXT ,total_expense INTEGER NOT NULL ,  '
				+ ' email TEXT);');
	});
	this.db
	.transaction(function(transaction) {
		transaction
		.executeSql('CREATE TABLE IF NOT EXISTS expenses '
				+ ' (exp_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, '
				+ ' exp_amount REAL NOT NULL, exp_description TEXT, exp_date STRING NOT NULL, exp_place  TEXT, '
				+ ' exp_owner INTEGER NOT NULL);');
	});

	buddyDatabase.errorHandler = error_handler;
}

buddyDatabase.prototype.initialise = function() {

};

buddyDatabase.prototype.addBuddy = function(name, phone, email, suscessFunction) {

	this.db
	.transaction(function(transaction) {
		transaction
		.executeSql(
				'INSERT INTO buddies (name, number, email,total_expense ) VALUES (?, ?, ?, ?);',
				[ name, phone, email, 0 ], suscessFunction,
				buddyDatabase.errorHandler);
	});

};

buddyDatabase.prototype.addExpense = function(buddy_id, expense_amount,
		expense_date, expense_desc, suscessFunction) {

	this.db
	.transaction(function(transaction) {
		transaction
		.executeSql(
				'INSERT INTO expenses (exp_owner, exp_amount, exp_date,exp_description ) VALUES (?, ?, ?, ?);',
				[ buddy_id, expense_amount, expense_date,
				  expense_desc ], suscessFunction,
				  buddyDatabase.errorHandler);
	});
	this.updateAggregateExpense(buddy_id);

};

buddyDatabase.prototype.updateExpense = function(expense_id, expense_amount,
		expense_date, expense_desc, suscessFunction) {
	var sql_query = "UPDATE expenses SET ";
	sql_query = sql_query + "exp_amount=" + expense_amount;
	sql_query = sql_query + ",exp_date='" + expense_date + "'";
	if (expense_desc.length != 0){
		sql_query = sql_query + ",exp_description='" + expense_desc + "'";		
	}
	sql_query = sql_query + " WHERE exp_id=" + expense_id + ";";
	alert(sql_query);

	this.db
	.transaction(function(transaction) {
		transaction
		.executeSql(
				sql_query,
				null, suscessFunction,
				buddyDatabase.errorHandler);
	});
	this.updateAggregateExpense(buddy_id);

};

buddyDatabase.prototype.getBuddies = function(handler) {
	this.db.transaction(function(transaction) {
		transaction.executeSql(
				'SELECT name,id,total_expense FROM buddies ORDER BY name;',
				null, handler, buddyDatabase.errorHandler);
	});
};

buddyDatabase.prototype.deleteEntryById = function(id) {
	this.db.transaction(function(transaction) {
		transaction.executeSql('DELETE FROM buddies WHERE id=?;', [ id ], null,
				buddyDatabase.errorHandler);
		transaction.executeSql('DELETE FROM expenses WHERE exp_owner=?;',
				[ id ], null, buddyDatabase.errorHandler);
	});
};

buddyDatabase.prototype.deleteExpenseById = function(id,buddy_id) {
	this.db.transaction(function(transaction) {
		transaction.executeSql('DELETE FROM expenses WHERE exp_id=?;', [ id ],
				null, buddyDatabase.errorHandler);
	});
	this.updateAggregateExpense(buddy_id);
};

buddyDatabase.prototype.deleteExpenseByBuddyId = function(buddy_id) {
	this.db.transaction(function(transaction) {
		transaction.executeSql('DELETE FROM expenses WHERE exp_owner=?;', [ buddy_id ],
				null, buddyDatabase.errorHandler);
	});
	this.updateAggregateExpense(buddy_id);
};


buddyDatabase.prototype.getExpenseDetails = function(id, handler) {
	var sql_query = 'SELECT exp_id, exp_amount, exp_description, exp_date FROM expenses WHERE exp_owner='
		+ id + ' ORDER BY exp_date' + ';';
	this.db.transaction(function(transaction) {
		transaction.executeSql(sql_query, null, handler,
				buddyDatabase.errorHandler);
	});
};

buddyDatabase.prototype.updateAggregateExpense = function(buddy_id) {
	var handler = function(transaction, result) {
		var exp = (result.rows.item(0).sumExpense);

		var sql_update = 'UPDATE buddies SET total_expense=' + exp
		+ ' WHERE id=' + buddy_id + ';';

		transaction.executeSql(sql_update, null, null,
				buddyDatabase.errorHandler);
	};

	//Get the sum of all the expenses for a particular buddy
	this.db.transaction(function(transaction) {
		transaction.executeSql('SELECT total(exp_amount) AS sumExpense FROM expenses WHERE exp_owner=?;', [buddy_id], handler,
				buddyDatabase.errorHandler);
	});
};
