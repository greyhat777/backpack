<?php

/**
 * @var $installer Mage_Core_Model_Resource_Setup
 * @var $adapter Varien_Db_Adapter_Pdo_Mysql
 */

$installer = $this;
$installer->startSetup();

$adapter = $installer->getConnection();
$tableNameAttribute = $installer->getTable('ave_colorswatch/attribute');
if (!$adapter->isTableExists($tableNameAttribute)) {
    $table = $adapter->newTable($tableNameAttribute)
        ->addColumn('attribute_id', Varien_Db_Ddl_Table::TYPE_INTEGER, null, array(
            'unsigned' => true,
            'nullable' => false,
            'primary'  => true,
        ), 'Attribute id')
        ->addColumn(Ave_ColorSwatch_Model_Observer::IS_COLOR_SWATCH, Varien_Db_Ddl_Table::TYPE_SMALLINT, null, array(
            'unsigned'  => true,
            'default'   => 0,
        ), 'Is Color Swatch')
        ->addIndex(
            $installer->getIdxName('ave_colorswatch/attribute', array(Ave_ColorSwatch_Model_Observer::IS_COLOR_SWATCH)),
            array(Ave_ColorSwatch_Model_Observer::IS_COLOR_SWATCH)
        )
        ->setComment('Color Swatch Status Attribute');
    $adapter->createTable($table);
}

$tableNameOption = $installer->getTable('ave_colorswatch/option');
if (!$adapter->isTableExists($tableNameOption)) {
    $tableO = $adapter->newTable($tableNameOption)
        ->addColumn('option_id', Varien_Db_Ddl_Table::TYPE_INTEGER, null, array(
            'unsigned' => true,
            'nullable' => false,
            'primary'  => true,
        ), 'Option id')
        ->addColumn('attribute_id', Varien_Db_Ddl_Table::TYPE_INTEGER, null, array(
            'unsigned' => true,
            'nullable' => false,
        ), 'Attribute id')
        ->addColumn('color', Varien_Db_Ddl_Table::TYPE_VARCHAR, 20, array(
            'nullable' => false
        ), 'Color code')
        ->addColumn('image', Varien_Db_Ddl_Table::TYPE_VARCHAR, 255, array(
            'nullable' => false
        ), 'Path to Image')
        ->addIndex($installer->getIdxName('ave_colorswatch/attribute', array('option_id')), array('option_id'))
        ->setComment('Color Swatch Options');
    $adapter->createTable($tableO);
}

$adapter->addForeignKey(
    'FK_ATTRIBUTE_RELATION_COLORSWATCH_ATTRIBUTE',
    $installer->getTable('ave_colorswatch/attribute'),
    'attribute_id',
    $installer->getTable('eav_attribute'),
    'attribute_id',
    'cascade',
    'cascade'
);

$installer->endSetup();


