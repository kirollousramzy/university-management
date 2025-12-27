const { v4: uuid } = require('uuid');
const { query } = require('./db');

// Get all attributes for an entity type
const getAttributesByEntityType = async (entityType) => {
  return await query(
    'SELECT id, entity_type, attribute_name, data_type, description, is_required, default_value, created_at FROM eav_attributes WHERE entity_type = ? ORDER BY attribute_name;',
    [entityType]
  );
};

// Get a single attribute by ID
const getAttributeById = async (attributeId) => {
  const rows = await query(
    'SELECT id, entity_type, attribute_name, data_type, description, is_required, default_value, created_at FROM eav_attributes WHERE id = ? LIMIT 1;',
    [attributeId]
  );
  return rows[0] || null;
};

// Create a new attribute
const createAttribute = async (attributeData) => {
  const {
    entityType,
    attributeName,
    dataType = 'string',
    description = null,
    isRequired = false,
    defaultValue = null
  } = attributeData;

  const attributeId = uuid();

  await query(
    'INSERT INTO eav_attributes (id, entity_type, attribute_name, data_type, description, is_required, default_value) VALUES (?, ?, ?, ?, ?, ?, ?);',
    [attributeId, entityType, attributeName, dataType, description, isRequired, defaultValue]
  );

  return await getAttributeById(attributeId);
};

// Update an attribute
const updateAttribute = async (attributeId, updates) => {
  const allowedFields = ['attribute_name', 'data_type', 'description', 'is_required', 'default_value'];
  const fieldsToUpdate = allowedFields.filter((field) => updates[field] !== undefined);

  if (!fieldsToUpdate.length) {
    throw new Error('No valid fields provided for update');
  }

  const values = fieldsToUpdate.map((field) => {
    const key = field === 'is_required' ? 'isRequired' : field === 'attribute_name' ? 'attributeName' : field === 'data_type' ? 'dataType' : field === 'default_value' ? 'defaultValue' : field;
    return updates[key] !== undefined ? updates[key] : updates[field];
  });
  values.push(attributeId);

  await query(
    `UPDATE eav_attributes SET ${fieldsToUpdate.map((f) => `${f} = ?`).join(', ')} WHERE id = ?;`,
    values
  );

  return await getAttributeById(attributeId);
};

// Delete an attribute (will cascade delete values)
const deleteAttribute = async (attributeId) => {
  const result = await query('DELETE FROM eav_attributes WHERE id = ?;', [attributeId]);
  return result.affectedRows > 0;
};

// Get all values for an entity
const getEntityValues = async (entityType, entityId) => {
  const rows = await query(
    `SELECT
      v.id,
      v.entity_type,
      v.entity_id,
      v.attribute_id,
      v.value_text,
      v.value_number,
      v.value_boolean,
      v.value_date,
      v.created_at,
      v.updated_at,
      a.attribute_name,
      a.data_type
    FROM eav_values v
    JOIN eav_attributes a ON a.id = v.attribute_id
    WHERE v.entity_type = ? AND v.entity_id = ?;`,
    [entityType, entityId]
  );

  return rows.map((row) => {
    let value = null;
    switch (row.data_type) {
      case 'number':
        value = row.value_number !== null ? Number(row.value_number) : null;
        break;
      case 'boolean':
        value = row.value_boolean;
        break;
      case 'date':
        value = row.value_date;
        break;
      case 'text':
      case 'string':
      default:
        value = row.value_text;
        break;
    }

    return {
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      attributeId: row.attribute_id,
      attributeName: row.attribute_name,
      dataType: row.data_type,
      value,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  });
};

// Get entity values as a key-value object
const getEntityValuesAsObject = async (entityType, entityId) => {
  const values = await getEntityValues(entityType, entityId);
  const result = {};
  values.forEach((v) => {
    result[v.attributeName] = v.value;
  });
  return result;
};

// Set a single value for an entity
const setEntityValue = async (entityType, entityId, attributeId, value) => {
  // Get attribute to determine data type
  const attribute = await getAttributeById(attributeId);
  if (!attribute) {
    throw new Error('Attribute not found');
  }

  if (attribute.entity_type !== entityType) {
    throw new Error('Attribute does not belong to this entity type');
  }

  // Check if value already exists
  const existing = await query(
    'SELECT id FROM eav_values WHERE entity_type = ? AND entity_id = ? AND attribute_id = ? LIMIT 1;',
    [entityType, entityId, attributeId]
  );

  const valueId = existing.length ? existing[0].id : uuid();

  // Prepare value based on data type
  let valueText = null;
  let valueNumber = null;
  let valueBoolean = null;
  let valueDate = null;

  switch (attribute.data_type) {
    case 'number':
      valueNumber = value !== null && value !== undefined ? Number(value) : null;
      break;
    case 'boolean':
      valueBoolean = value !== null && value !== undefined ? Boolean(value) : null;
      break;
    case 'date':
      valueDate = value !== null && value !== undefined ? value : null;
      break;
    case 'text':
    case 'string':
    default:
      valueText = value !== null && value !== undefined ? String(value) : null;
      break;
  }

  if (existing.length) {
    // Update existing value
    await query(
      `UPDATE eav_values SET
        value_text = ?,
        value_number = ?,
        value_boolean = ?,
        value_date = ?
      WHERE id = ?;`,
      [valueText, valueNumber, valueBoolean, valueDate, valueId]
    );
  } else {
    // Insert new value
    await query(
      `INSERT INTO eav_values (id, entity_type, entity_id, attribute_id, value_text, value_number, value_boolean, value_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [valueId, entityType, entityId, attributeId, valueText, valueNumber, valueBoolean, valueDate]
    );
  }

  return await query(
    `SELECT
      v.id,
      v.entity_type,
      v.entity_id,
      v.attribute_id,
      v.value_text,
      v.value_number,
      v.value_boolean,
      v.value_date,
      v.created_at,
      v.updated_at,
      a.attribute_name,
      a.data_type
    FROM eav_values v
    JOIN eav_attributes a ON a.id = v.attribute_id
    WHERE v.id = ? LIMIT 1;`,
    [valueId]
  ).then((rows) => {
    const row = rows[0];
    let value = null;
    switch (row.data_type) {
      case 'number':
        value = row.value_number !== null ? Number(row.value_number) : null;
        break;
      case 'boolean':
        value = row.value_boolean;
        break;
      case 'date':
        value = row.value_date;
        break;
      default:
        value = row.value_text;
        break;
    }

    return {
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      attributeId: row.attribute_id,
      attributeName: row.attribute_name,
      dataType: row.data_type,
      value,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  });
};

// Set multiple values for an entity
const setEntityValues = async (entityType, entityId, values) => {
  const results = [];
  for (const [attributeName, value] of Object.entries(values)) {
    // Find attribute by name
    const attrRows = await query(
      'SELECT id FROM eav_attributes WHERE entity_type = ? AND attribute_name = ? LIMIT 1;',
      [entityType, attributeName]
    );

    if (attrRows.length === 0) {
      throw new Error(`Attribute '${attributeName}' not found for entity type '${entityType}'`);
    }

    const attributeId = attrRows[0].id;
    const result = await setEntityValue(entityType, entityId, attributeId, value);
    results.push(result);
  }
  return results;
};

// Delete a value for an entity
const deleteEntityValue = async (entityType, entityId, attributeId) => {
  const result = await query(
    'DELETE FROM eav_values WHERE entity_type = ? AND entity_id = ? AND attribute_id = ?;',
    [entityType, entityId, attributeId]
  );
  return result.affectedRows > 0;
};

// Delete all values for an entity
const deleteAllEntityValues = async (entityType, entityId) => {
  const result = await query('DELETE FROM eav_values WHERE entity_type = ? AND entity_id = ?;', [
    entityType,
    entityId
  ]);
  return result.affectedRows;
};

// Get all entity types
const getEntityTypes = async () => {
  const rows = await query('SELECT DISTINCT entity_type FROM eav_attributes ORDER BY entity_type;');
  return rows.map((row) => row.entity_type);
};

module.exports = {
  getAttributesByEntityType,
  getAttributeById,
  createAttribute,
  updateAttribute,
  deleteAttribute,
  getEntityValues,
  getEntityValuesAsObject,
  setEntityValue,
  setEntityValues,
  deleteEntityValue,
  deleteAllEntityValues,
  getEntityTypes
};


