function createDataset(fields, constraints, sortFields) {
	try {
		return processResult(callService(fields, constraints, sortFields));
	} catch(e) {
		return processErrorResult(e, constraints);
	}
}

function callService(fields, constraints, sortFields) {
	var databaseData = data();
	var resultFields, queryClauses;

	resultFields = getOutputFields(databaseData.outputValues);
	queryClauses = verifyConstraints(databaseData, constraints);

	var result = DatabaseManager.select(databaseData.fluigService, databaseData.operation, resultFields, queryClauses, databaseData.extraParams);

	return result;
}

function defineStructure() {
	var databaseData = data();
	var columns = getOutputFields(databaseData.outputValues);

	for (column in columns) {
		var columnName = removeInvalidChars(columns[column]);
		if (!DatabaseManager.isReservedWord(columnName)) {
			addColumn(columnName);
		} else {
			addColumn('ds_' + columnName);
		}
	}
	if (databaseData.extraParams.key) {
		setKey([databaseData.extraParams.key]);
	}
}

function onSync(lastSyncDate) {
	var databaseData = data();
	var synchronizedDataset = DatasetBuilder.newDataset();

	try {
		var resultDataset = processResult(callService());
		if (resultDataset != null) {
			var values = resultDataset.getValues();
			for (var i = 0; i < values.length; i++) {
				if (databaseData.extraParams.key) {
					synchronizedDataset.addOrUpdateRow(values[i]);
				} else {
					synchronizedDataset.addRow(values[i]);
				}
			}
		}

	} catch(e) {
		log.info('Dataset synchronization error : ' + e.message);

	}
	return synchronizedDataset;
}

function verifyConstraints(params, constraints) {
	var allConstraints = new Array();

	if (constraints != null) {
		for (var i = 0; i < constraints.length; i++) {
			if (constraints[i].getFieldName().toLowerCase() == 'sqllimit') {
				params.extraParams['limit'] = constraints[i].getInitialValue();
			} else {
				allConstraints.push(constraints[i]);
			}
		}
	}

	if (allConstraints.length == 0) {
		for (i in params.inputValues) {
			for (j in params.inputValues[i]) {
				var param = params.inputValues[i][j];
				var constraint = DatasetFactory.createConstraint(param.fieldName, param.initialValue, param.finalValue, param.constraintType);
				constraint.setLikeSearch(param.likeSearch);
				constraint.setFieldType(DatasetFieldType.valueOf(param.fieldType));
				allConstraints.push(constraint);
			}
		}
	}
	return allConstraints;
}

function getOutputFields(outputValues) {
	var outputFields = new Array();
	if (outputValues != null) {
		for (field in outputValues) {
			if (outputValues[field].result) {
				outputFields.push(field);
			}
		}
	}
	return outputFields;
}

function processResult(result) {
	var databaseData = data();
	var dataset = DatasetBuilder.newDataset();
	var columns = getOutputFields(databaseData.outputValues);

	for (column in columns) {
		dataset.addColumn(columns[column]);
	}

	for (var i = 0; i < result.size(); i++) {
		var datasetRow = new Array();
		var item = result.get(i);
		for (param in columns) {
			datasetRow.push(item.get(columns[param]));
		}
		dataset.addRow(datasetRow);
	}

	return dataset;
}

function processErrorResult(error, constraints) {
	var dataset = DatasetBuilder.newDataset();

	dataset.addColumn('error');
	dataset.addRow([error.message]);

	return dataset;
}

function removeInvalidChars(columnName) {
	var invalidChars = '#';
	var newChar = '_';
	for (var i = 0; i < invalidChars.length; i++) {
		columnName = columnName.split(invalidChars[i]).join(newChar);
	}

	return columnName;
}

function data() {
	return {
  "fluigService" : "AppDS",
  "operation" : "ML001028",
  "tableType" : "TABLE",
  "parameters" : [ ],
  "inputValues" : {
    "anonymization_date" : [ ],
    "anonymization_user_id" : [ ],
    "cardid" : [ ],
    "companyid" : [ ],
    "dados_extras" : [ ],
    "documentid" : [ ],
    "empresa_cnpj" : [ ],
    "empresa_nome" : [ ],
    "empresa_site" : [ ],
    "fonte_insercao" : [ ],
    "ID" : [ ],
    "lead_cargo" : [ ],
    "lead_email" : [ ],
    "lead_id" : [ ],
    "lead_linkedin" : [ ],
    "lead_nome" : [ ],
    "lead_origem" : [ ],
    "lead_status" : [ ],
    "lead_telefone" : [ ],
    "tableid" : [ ],
    "version" : [ ]
  },
  "inputAssignments" : { },
  "outputValues" : {
    "anonymization_date" : {
      "result" : true,
      "type" : "date"
    },
    "anonymization_user_id" : {
      "result" : true,
      "type" : "varchar"
    },
    "cardid" : {
      "result" : true,
      "type" : "int"
    },
    "companyid" : {
      "result" : true,
      "type" : "int"
    },
    "dados_extras" : {
      "result" : true,
      "type" : "varchar"
    },
    "documentid" : {
      "result" : true,
      "type" : "int"
    },
    "empresa_cnpj" : {
      "result" : true,
      "type" : "varchar"
    },
    "empresa_nome" : {
      "result" : true,
      "type" : "varchar"
    },
    "empresa_site" : {
      "result" : true,
      "type" : "varchar"
    },
    "fonte_insercao" : {
      "result" : true,
      "type" : "varchar"
    },
    "ID" : {
      "result" : true,
      "type" : "int"
    },
    "lead_cargo" : {
      "result" : true,
      "type" : "varchar"
    },
    "lead_email" : {
      "result" : true,
      "type" : "varchar"
    },
    "lead_id" : {
      "result" : true,
      "type" : "varchar"
    },
    "lead_linkedin" : {
      "result" : true,
      "type" : "varchar"
    },
    "lead_nome" : {
      "result" : true,
      "type" : "varchar"
    },
    "lead_origem" : {
      "result" : true,
      "type" : "varchar"
    },
    "lead_status" : {
      "result" : true,
      "type" : "varchar"
    },
    "lead_telefone" : {
      "result" : true,
      "type" : "varchar"
    },
    "tableid" : {
      "result" : true,
      "type" : "varchar"
    },
    "version" : {
      "result" : true,
      "type" : "int"
    }
  },
  "outputAssignments" : { },
  "extraParams" : { }
};
}