/**
 * 
 */

var buddyDb;
$(document).ready(function() {
	if (typeof(PhoneGap) != 'undefined') {
		$('body > *').css({minHeight: '460px !important'});
		}
	initialiseDb();
	$('#home').live('pagebeforeshow',function(event, ui){
		refreshBuddyExpList();
		$("#expense_details_delete .ui-btn-text").text('Edit Mode');
	});

	$('#home #AddExpense').click(function(){
		//Add expense view should have the default behaviour
		sessionStorage.expenseId = -1;

	});
	
	$('#expense_details').live('pageshow',function(){
		$.mobile.pageLoading( true );
	
	});

	$("#expense_details #add_buddy_expense").click(function(){
		//Add expense view should add expense for a particular buddy
		sessionStorage.expenseId = -2;

	}
	);

	$('#expense_details_deleteall').click(function(){
		var r = confirm("Are you sure to delete all entries");
		if (r){
			buddyDb.deleteExpenseByBuddyId(sessionStorage.buddyId);
			//CLear the display & refresh
			$('#expense_details ul').remove();
			$('#expense_details ul').listview('refresh');
		}
	});

	$('#expense_details_delete').click(function(){
		if($("#expense_details_delete").text() == "Edit Mode"){
			$('#expense_details .delete_expense').show();
			$('#expense_details_deleteall').show();
			$("#expense_details_delete .ui-btn-text").text('ViewMode');
		}
		else{
			$('#expense_details .delete_expense').hide();
			$('#expense_details_deleteall').hide();
			$("#expense_details_delete .ui-btn-text").text('Edit Mode');
		}

		//$('#expense_details_delete').text("View Mode");

	}
	);



	$('#add_expense').live('pagebeforeshow',function(event, ui){
		prepareAddExpensePage();

	});

	$('#expense_details').live('pagebeforeshow',function(event, ui){
		//refreshExpenseDetails();

	});

	$('#manage_buddies').live('pagehide',function(event, ui){
		//some problems earlier with updating the display
		//prepareAddExpense();

	});

	//$('#select_buddy *').remove();
	//If prepareAddExpense() is called immediately after initialiseDb(), it is not working properly
	//may be the db is not initialised immediately
	//Hence this function is called after 1 sec
	setTimeout("delayedInit()",1000);
	$('#addbuddy form').submit(createBuddy);
	$('#ManageBuddies').click(function(){
		refreshBuddies();
	}
	);

	$('#add_expense_submit').click(function(){
		addExpense();
	}
	);


});

function initialiseDb() {
	var shortName = 'buddyDb';
	var version = '1.0';
	var maxSize = 65536;
	buddyDb = new buddyDatabase(shortName, version, maxSize, errorHandler);
	buddyDb.initialise();

}

function delayedInit(){
	prepareAddExpense();
	//refreshBuddyExpList();

}

function createBuddy() {
	var buddyName = $('#buddyName').val();
	var phone = $('#phone').val();
	var email = $('#emailid').val();
	var handler = function() {
		refreshBuddies();
		history.back();
	};
	if (buddyName.toString().length == 0){
		$('#buddyNameValidate').text("Please enter valid name");
	}
	else{
		buddyDb.addBuddy(buddyName, phone, email, handler);
		$('#buddyNameValidate').text("");
	}
	return false;
}

function errorHandler(transaction, error) {
	alert('Oops. Error was ' + error.message + ' (Code ' + error.code + ')');
	return true;
}

function refreshBuddies() {
	$('#manage_buddies ul li:gt(0)').remove();

	var handler = function(transaction,result){
		for (var i=0; i < result.rows.length; i++) {
			var row = result.rows.item(i);
			var newEntryRow = $('#BuddyTemplate').clone();
			newEntryRow.removeAttr('id');
			newEntryRow.removeAttr('style');
			newEntryRow.appendTo('#manage_buddies ul');
			newEntryRow.find('.buddyName').text(row.name);
			newEntryRow.find('.buddyId').text(row.id);

			newEntryRow.find('.delete').click(function(){
				var clickedEntry = $(this).parent();
				var clickedEntryId = clickedEntry.find('.buddyId').text();
				buddyDb.deleteEntryById(clickedEntryId);
				clickedEntry.remove();
				$('#manage_buddies ul').listview('refresh');
			});
		}
	}; 

	buddyDb.getBuddies(handler);

}

function prepareAddExpensePage(){
	prepareAddExpense();
	updateFormElements($('#add_expense_form'));
}

function prepareAddExpense(){
	var template = '<option value="buddyid">name</option>';
	var options = '';
	
	//Default behaviour, add new expense
	if (sessionStorage.expenseId == -1){
		var handler = function(transaction,result){
			//var template = '<option value="buddyid">name</option>';
			var option = '';
			for (var i=0; i < result.rows.length; i++) {
				var row = result.rows.item(i);
				option = template.replace(/buddyid/, row.id);
				option = option.replace(/name/, row.name);
				options = options + option;
				//$("#select_buddy").append(option);
			}
			$("#select_buddy").html(options).selectmenu('refresh', true);
		}; 
		buddyDb.getBuddies(handler);
	}
	else {
		options = template.replace(/name/, sessionStorage.buddyName);
		options = options.replace(/buddyid/, sessionStorage.buddyId);
		//Add new expense for the selected buddy
		if(sessionStorage.expenseId == -2){

		}
		//Edit selected expense
		else{

		}
		$("#select_buddy").html(options).selectmenu('refresh', true);

	}

}

function updateFormElements(ele) {
	//This case is about adding new expense, hence reset form elements
	if(sessionStorage.expenseId < 0){
		$(ele).find(':input').each(function() {
			switch(this.name) {
			case 'expense_date':
				var now = new Date();
				$(this).val(now.format("yyyy-mm-dd"));
				break;
			case 'expense_desc':
			case 'expense_amount':
				$(this).val('');
				break;
			case 'radio-choice-1':
				break;
			}
		});
	}
	//This case handles editign existing expense, hence update the form elements
	else{
		$(ele).find(':input').each(function() {
			switch(this.name) {
			case 'expense_date':
				$(this).val(sessionStorage.expenseDate);
				break;
			case 'expense_desc':
				$(this).val(sessionStorage.expenseDescription);
				break;
			case 'expense_amount':
				$(this).val(Math.abs(sessionStorage.expenseAmount));
				break;
			case 'radio-choice-1':
				if (sessionStorage.expenseAmount < 0){
					$(this).filter('[value=give]').click();
					$(this).filter('[value=give]').click();
				}
				else{
					$(this).filter('[value=take]').click();
					$(this).filter('[value=take]').click();
				}
				break;
			}
		});

	}
}


function addExpense(){
	var validate = true;
	var buddy_id = $("#add_expense_form #select_buddy").val();
	var expense_amount = $("#add_expense_form input[name=expense_amount]").val();
	var checked = $('#add_expense_form input[name=radio-choice-1]:checked').val();
	var expense_desc = $("#add_expense_form input[name=expense_desc]").val();
	var expense_date = $("#add_expense_form input[name=expense_date]").val();

	var handler = function() {
		history.back();
	};

	if (/^\.?$/.test(expense_amount) || !/^\d*\.?\d*$/.test(expense_amount)) {
		//if (/^\.?$/.test(expense_amount) || !/^-?\d*\.?\d*$/.test(expense_amount)) {
		$('#expense_amount_validate').text("Please enter positive amount");
		validate = false;
	}
	else{
		$('#expense_amount_validate').text("");
		if (checked == "give"){
			expense_amount = expense_amount * -1;
		}
	}
	if(validate){
		//Add new expense
		if (sessionStorage.expenseId < 0){
			buddyDb.addExpense(buddy_id, expense_amount, expense_date, expense_desc, handler);
		}
		//Update the existing expense
		else{
			buddyDb.updateExpense(sessionStorage.expenseId, expense_amount, expense_date, expense_desc, handler);
		}
		
	}
	return false;

}


function mobileini(){
	$.mobile.page.prototype.options.degradeInputs.date = true;
}


function refreshBuddyExpList(){
	$('#home ul li').remove();
	var template = '<li><a id="buddy_id" href="#" rel=external>name</a><span class="ui-li-count">amount</span></li>';
	var list='';

	var handler = function(transaction,result){
		var str;
		for (var i=0; i < result.rows.length; i++) {
			var row = result.rows.item(i);
			str = template.replace(/name/, row.name);
			str = str.replace(/amount/, row.total_expense);
			str = str.replace(/buddy_id/, row.id);
			list = list + str; 
		}
		$('#home ul').html(list).listview('refresh');

		//$('#home ul').listview('refresh');
		//Assign click handlers for entries in main page
		$('#home ul li a').click(function(){
			//Store the id of the clicked entry
			$.mobile.pageLoading();
			sessionStorage.buddyId = this.id;
			sessionStorage.buddyName = $(this).text();
			var callback = function(){
				$.mobile.changePage ("#expense_details",null,false,true);
			};
			refreshExpenseDetails(callback);
			 
		});
	}; 

	buddyDb.getBuddies(handler);

}

function refreshExpenseDetails(callback){
	$('#expense_details h1').text(sessionStorage.buddyName + ": Expense Details");
	$('#expense_details ul li').remove();
	var template =  '<li data-expid="expense_id"><h3><a data-expid="expense_id" class="single_expense" href="#add_expense">exp_desc</a></h3><h5>exp_date</h5><span class="ui-li-count">exp_amount</span><a class="delete_expense">Delete Entry</a></li>';
	var laterCallback = callback;
	//var template =  '<li data-expid="expense_id"><h3><a data-expid="expense_id" class="single_expense" href="#add_expense">exp_desc</a></h3><h5>exp_date</h5><span class="ui-li-count">exp_amount</span></li>';
	var list = '';

	var handler = function(transaction,result){
		var str;
		for (var i=0; i < result.rows.length; i++) {
			var row = result.rows.item(i);
			str = template.replace(/exp_desc/, row.exp_description);
			str = str.replace(/exp_amount/, row.exp_amount);
			str = str.replace(/exp_date/, row.exp_date);
			str = str.replace(/expense_id/g, row.exp_id);
			list = list + str;
		}
		
		laterCallback();
		$('#expense_details ul').html(list).listview('refresh');
		
		$('#expense_details .delete_expense').click(function(){
			buddyDb.deleteExpenseById($(this).parent().attr("data-expid"),sessionStorage.buddyId);
			$(this).parent().remove();
			$('#expense_details ul').listview('refresh');
		});

		$('#expense_details .single_expense').click(function(){
			sessionStorage.expenseId = $(this).attr("data-expid");
			sessionStorage.expenseDescription = $(this).text(); 
			sessionStorage.expenseDate = $(this).parent().siblings('h5').text();
			sessionStorage.expenseAmount = $(this).parent().siblings('.ui-li-count').text();
		});

		//$('.delete_expense').css("display","none");
		$('#expense_details .delete_expense').hide();
		$('#expense_details_deleteall').hide();

		//$('#expense_details ul li .delete_expense').hide();
	}; 

	buddyDb.getExpenseDetails(sessionStorage.buddyId, handler);

}