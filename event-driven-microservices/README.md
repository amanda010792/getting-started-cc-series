# Event-Driven Microservices 

## Prerequisites
Before completing this workshop, please ensure you have / have done the following: 
- A Confluent Cloud login with Environment Admin Access to the environment you'll be using 
- Download the [Confluent CLI](https://docs.confluent.io/confluent-cli/current/install.html)
- Install NodeJS (version 18.8.0) 


## Provision a Basic Cluster

** This step can be skipped if you completed this in the first workshop **     

Within your environment, select "Add Cluster". You'll see that there are three different cluster types. 
- **Basic Clusters** are used for development or ephemeral workloads as they come with a lower uptime SLA (99.5%) and have hard limits for throughput, storage, partitions and other capacity requirements. They scale automatically up to their limitations and are multi-tenant environments, meaning your team will be sharing certain resources with other customers (however, you will be logically isolated and not have to worry about noisy neighbors). 
- **Standard Clusters** can be used in either a pre-production or production capacity, as they have an uptime SLA of up to 99.99%, have the ability to be set up across multiple availabiltiy zones and provide unlimited storage. However, as they are also multi-tenant in nature, they have limitations for throughput, number of partitions and other capacity units. Basic and Standard Clusters meet a number of compliance standards, which can be found here. 
- **Dedicated Clusters** are resources provisioned exclusively for your team in a dedicated Confluent-Owned VPC/VNet. They provide an uptime SLA of up to 99.99%, allow for private networking and are sized based on buckets of provisioned capacity called CKUs. Each CKU provides a set limit on throughput, partitions and client connections, and CKUs can be added or removed at any time (with no downtime to the user). If your use case requires HIPAA compliance, Dedicated Clusters are the way to go - as they are HIPAA ready.      

Today, we will be provisioning a Basic cluster. Choose Basic and click "Begin Configuration". Select Azure and us-west-2 (as these are where our governance features are located). Name your cluster "<YOUR_NAME>_Transactions". Click "Launch Cluster". Within a minute, your cluster should be provisioned! You can also use the [CLI](https://docs.confluent.io/confluent-cli/current/command-reference/kafka/cluster/confluent_kafka_cluster_create.html#confluent-kafka-cluster-create) and [REST API](https://docs.confluent.io/cloud/current/api.html) to provision clusters. 

## Provision a ksqlDB Cluster

** This step can be skipped if you completed this in the first workshop **    

ksqlDB is a stream processing tool that allows you to write sql-like syntax to do transformations, joins, filtering and other aggregations against your streaming data. We will be using it today to process mock financial data. As opposed to running aggregations against our data once it's at rest, we can process the data in real-time and get immediate insights before landing it in our downstream systems. Further, while stream processing typically includes writing and maintaing complex code, ksqlDB simplifies the most common data transformations.     

Once your Basic Cluster is provisioned, open the cluster resource and select the ksqlDB tab on the left hand menu. Select the "add cluster" button. Give your cluster "global access" (in production we would lock this down with more granular permissions, but for now we will just use the global access option). Name your cluster "<YOUR_NAME>_ksql" and choose 1 CSU for cluster size (CSUs determine the amount of data that your ksqlDB cluster can process). Click the "Launch Cluster" button. We will come back to this in a later step once the cluster is provisioned. 

## Create Topics 

** This step can be skipped if you completed this in the first workshop but make sure you add the third topic - <YOUR_NAME>_trades **    

On your cluster's left hand menu, select the "Topics" tab. Topics are the way Confluent stores data. Each topic is an immutable log of records optionally split into multiple partitions. When developing on Confluent Cloud, you can select your retention period (and even choose to keep data indefinitely!) on a per-topic basis. Today, we will be creating two topics to store mock transaction and credit card data. We will also use Confluent's schema registry to define a schema for our data. There is one Schema Registry per environment, meaning you'll share the Schema Registry instance with other clusters hosted in the same environment. You can choose to serialize your data with AVRO, Protobuf or JSON (Kafka does not require a specific serialization format, but you will have to choose one of these if you want to reap the benefits of the Schema Registry tool).     

Once you are in the topic explorer, select "Add Topic". Name your topic "<YOUR_NAME>_cards" and leave all defaults the same (hint: look at the advanced settings, what do they mean? What if you wanted to store all credit card data for 7 years?). Click "Create With Defaults". Add a second topic "<YOUR_NAME>_transactions" but change the number of partitions to 1 (this will guarantee order across the entire topic). Create your topic. Add a third topic "<YOUR_NAME>_trades" but change the number of partitions to 1 (this will guarantee order across the entire topic). Create your topic.         


## Create Source Connectors 

** This step can be skipped if you completed this in the first workshop but make sure you add the third connector - trades **    

On your cluster's left hand menu, select the "Data Integration" tab and choose "Connectors". The Connectors page will allow you to search for various systems you want to connect to. Kafka Connect is an API built on top of the standard producers and consumers. Many partners, members of the open source community and Confluent employees have built connectors to the most popular system (there are over 200!). Many of these connectors are event available fully managed in Confluent Cloud. You can search for a connector on the Connectors tab, or use one of the most widely adopted connectors (shown at the top of the list). Today, we will set up two DataGen connectors to generate mock transaction, credit card and stock trade data. Let's configure 3 DataGen Source connectors with the configurations below:


#### Credit Card DataGen Source

| Config Name  | Config Value |
| ------------- | ------------- |
| Sample Data  | Credit Cards  |
| Output Record Format  | JSON_SR  |
| Topic  | "<YOUR_NAME>_cards"  |
| Access  | Global Access (generate API Key and Download, we will use this again)  |
| Sizing  | 1 Task  |
| Connector Name  | DatagenCards  |

#### Transactions DataGen Source

| Config Name  | Config Value |
| ------------- | ------------- |
| Sample Data  | Transactions  |
| Output Record Format  | JSON_SR  |
| Topic  | "<YOUR_NAME>_transactions"  |
| Access  | Use Existing Key (use key/secret generated above)  |
| Sizing  | 1 Task  |
| Connector Name  | DatagenTransactions  |

#### StockTrades DataGen Source

| Config Name  | Config Value |
| ------------- | ------------- |
| Sample Data  | Stock Trades  |
| Output Record Format  | JSON_SR  |
| Topic  | "<YOUR_NAME>_trades"  |
| Access  | Use Existing Key (use key/secret generated above)  |
| Sizing  | 1 Task  |
| Connector Name  | DatagenTrades  |


Once the connector is provisioned, we will be able to see data flowing throguh. To validate, we can go into the Topics tab, select one of our topics and choose "Messages". You'll see data flowing through in real time. Notice that in our credit card topic, we can see card numbers.

## Transform Data Streams Using ksqlDB

In this workshop, we will be using ksqlDB to do some basic transformations and prepare our data for the UI. Let's assume we need to filter out the card and transaction info for just one given card ID. Let's assume the user we are viewing has card ID 9. First, we will need to create a stream called cards on top of the cards topic we created:         

```
  CREATE STREAM cards WITH (
    KAFKA_TOPIC = '<YOUR_NAME>_cards',
    VALUE_FORMAT = 'JSON_SR'
  );
```

Make sure you set the property "auto.offset.reset" to Earliest! Click "Run Query". This will create a stream abstraction on top of your cards topic.     


Next, we will need to create a ksql query to filter card data for card id = 9. 
```
CREATE TABLE cards_user9 WITH (
    KAFKA_TOPIC='agilbert_cards_tbl'
  ) AS
  SELECT
    card_id KEY,
    latest_by_offset(card_number) card_number,
    latest_by_offset(cvv) cvv,
    latest_by_offset(expiration_date) expiration_date
  FROM cards 
  WHERE card_id=9
  GROUP BY card_id;
  ```
Let's create a stream for our transactions data:     

```
CREATE STREAM transactions WITH (
    KAFKA_TOPIC = '<YOUR_NAME>_transactions',
    VALUE_FORMAT = 'JSON_SR'
  );
```

Next, let's filter out our transactions for card id = 9. 

```
CREATE STREAM transactions9 WITH (
    KAFKA_TOPIC = '<YOUR_NAME>_transactions9',
    VALUE_FORMAT = 'JSON_SR'
  )
  AS SELECT * FROM transactions WHERE CARD_ID=9;
```


## Monitor your Data Streams Using Stream Lineage 
  
On the left hand menu, select the "Stream Lineage" tab. Here, we can monitor our data flow. You will see the entire data flow we set up is there: connector, topic, ksqlDB query and subsequent topic. We can drill down into different parts of our data 
