<?php
$installer = $this;
$installer->startSetup();
$sql=<<<SQLTEXT
create table {$this->getTable('solwinbannerslider')} (
    id int not null auto_increment,
    title varchar(255),
    image varchar(255),
    description varchar(255),
    showdesc int(11) NOT NULL DEFAULT '0', 
    url varchar(255),
    target varchar(255),
    imageorder varchar(255),
    status varchar(255), 
    primary key(id)
);

SQLTEXT;

$installer->run($sql);
$installer->endSetup();	 
