# Workshop - Setting Data in Motion with Confluent Cloud


## Prerequisites 

Before completing this workshop, make sure you have the following: 
- A login to Confluent Cloud and Environment Admin Access to the Environment you'll be using for this workshop.
- Download the [Confluent CLI](https://docs.confluent.io/confluent-cli/current/install.html)

## Provision a Basic Cluster

Within your environment, select "Add Cluster". You'll see that there are three different cluster types. 
- **Basic Clusters** are used for development or ephemeral workloads as they come with a lower uptime SLA (99.5%) and have hard limits for throughput, storage, partitions and other capacity requirements. They scale automatically up to their limitations and are multi-tenant environments, meaning your team will be sharing certain resources with other customers (however, you will be logically isolated and not have to worry about noisy neighbors). 
- **Standard Clusters** can be used in either a pre-production or production capacity, as they have an uptime SLA of up to 99.99%, have the ability to be set up across multiple availabiltiy zones and provide unlimited storage. However, as they are also multi-tenant in nature, they have limitations for throughput, number of partitions and other capacity units. Basic and Standard Clusters meet a number of compliance standards, which can be found here. 
- **Dedicated Clusters** are resources provisioned exclusively for your team in a dedicated Confluent-Owned VPC/VNet. They provide an uptime SLA of up to 99.99%, allow for private networking and are sized based on buckets of provisioned capacity called CKUs. Each CKU provides a set limit on throughput, partitions and client connections, and CKUs can be added or removed at any time (with no downtime to the user). If your use case requires HIPAA compliance, Dedicated Clusters are the way to go - as they are HIPAA ready.      

Today, we will be provisioning a Basic cluster. Choose Basic and click "Begin Configuration". Select your cloud provider and region of choice. Name your cluster "<YOUR_NAME>_Transactions". Click "Launch Cluster". Within a minute, your cluster should be provisioned! You can also use the [CLI](https://docs.confluent.io/confluent-cli/current/command-reference/kafka/cluster/confluent_kafka_cluster_create.html#confluent-kafka-cluster-create) and [REST API](https://docs.confluent.io/cloud/current/api.html) to provision clusters. 

## Provision a ksqlDB Cluster

ksqlDB is a stream processing tool that allows you to write sql-like syntax to do transformations, joins, filtering and other aggregations against your streaming data. We will be using it today to process mock financial data. As opposed to running aggregations against our data once it's at rest, we can process the data in real-time and get immediate insights before landing it in our downstream systems. Further, while stream processing typically includes writing and maintaing complex code, ksqlDB simplifies the most common data transformations.     

Once your Basic Cluster is provisioned, open the cluster resource and select the ksqlDB tab on the left hand menu. Select the "add cluster" button. Give your cluster "global access" (in production we would lock this down with more granular permissions, but for now we will just use the global access option). Name your cluster "<YOUR_NAME>_ksql" and choose 1 CSU for cluster size (CSUs determine the amount of data that your ksqlDB cluster can process). Click the "Launch Cluster" button. We will come back to this in a later step once the cluster is provisioned. 

## Create Topics 

On your cluster's left hand menu, select the "Topics" tab. Topics are the way Confluent stores data. Each topic is an immutable log of records optionally split into multiple partitions. When developing on Confluent Cloud, you can select your retention period (and even choose to keep data indefinitely!) on a per-topic basis. Today, we will be creating two topics to store mock transaction and credit card data. We will also use Confluent's schema registry to define a schema for our data. There is one Schema Registry per environment, meaning you'll share the Schema Registry instance with other clusters hosted in the same environment. You can choose to serialize your data with AVRO, Protobuf or JSON (Kafka does not require a specific serialization format, but you will have to choose one of these if you want to reap the benefits of the Schema Registry tool).     

Once you are in the topic explorer, select "Add Topic". Name your topic "<YOUR_NAME>_cards" and leave all defaults the same (hint: look at the advanced settings, what do they mean? What if you wanted to store all credit card data for 7 years?). Click "Create With Defaults". Add a second topic "<YOUR_NAME>_transactions" but change the number of partitions to 1 (this will guarantee order across the entire topic). Create your topic.        


## Create Source Connectors 

On your cluster's left hand menu, select the "Data Integration" tab and choose "Connectors". The Connectors page will allow you to search for various systems you want to connect to. Kafka Connect is an API built on top of the standard producers and consumers. Many partners, members of the open source community and Confluent employees have built connectors to the most popular system (there are over 200!). Many of these connectors are event available fully managed in Confluent Cloud. You can search for a connector on the Connectors tab, or use one of the most widely adopted connectors (shown at the top of the list). Today, we will set up two DataGen connectors to generate mock transaction and credit card data. Let's configure 2 DataGen Source connectors with the configurations below:


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


Once the connector is provisioned, we will be able to see data flowing throguh. To validate, we can go into the Topics tab, select one of our topics and choose "Messages". You'll see data flowing through in real time. Notice that in our credit card topic, we can see card numbers. What if we want to expose this data to a consumer, but we want to mask certain fields? More on that in a few... 

## Tag PII Data to Meet Compliance Standards 

#### Data Governance in Confluent Cloud

With the sharp rise of real-time data, the need for organizational governance over data in motion is growing quickly. As investments into microservices increase and data sources scale, it becomes more and more challenging for any individual or team to understand or govern the full scope of streams flowing across the business.     

To enable a generation of event-centric enterprises, Confluent developed Stream Governance: governance built for data in motion, allowing businesses to operate around a central nervous system of real-time data. Stream Governance is built on three key pillars:     
- Stream Lineage: Understand complex data relationships and uncover more insights with interactive, end-to-end maps of event streams.
- Stream Catalog: Increase collaboration and productivity with self-service data discovery that allows teams to classify, organize, and find the event streams they need.
- Stream Quality: Deliver trusted, high-quality event streams to the business and maintain data integrity as services evolve.    

#### Putting Data Governance to Use: Tag your PII Data 

Prior to the workshop today, an admin created a tag at the **environment** level. Navigate to the environment you are using for the workshop today and you will see a menu to the right of your clusters dedicated to Stream Governance. This menu will tell you how many schemas and tags are currently set up on your environment. If you click on the "Tags" option, you'll see we currently have a tag for PII data. We will use this tag to communicate to other kafka users that this data needs to be treated in a compliant manner.  

We have already set some governance in place by using Schema Registry. Let's see that in action: navigate back to your cluster, open the Topics tab in the left hand menu and select the "<YOUR_NAME>_cards" topic created above. Click on the "Schema" tab to see the current version of your schema. Under "Properties" you will see the fields of our schema. We can drill down further and see the data type as well. To the right of the "card_number" field, click the + button. Apply the "PII" tag to this field. Using the search bar at the top of the dashboard, we can search to see what data is tagged as "PII". You should see the field you just tagged (along with the fields of your fellow workshop participants in the same environment). This allows us to set up standards on data sharing based on the type of data living in our clusters.       


## Transform Data Streams Using ksqlDB

In this workshop, we will be using ksqlDB to do some basic transformations and prepare our data for a downstream consumer. Let's assume we have a team who needs access to the transactions data and credit card data, but the team only needs to know that the card is not expired (and therefore don't need to know any PII data). In order to give the team the data they need (while remaining in compliance), we will join the two data streams together, adding a field indicating whether the card is expired, and mask the PII data. ksqlDB queries can be strung together to perform different transformations, and teams can be given access to the data at different transformation stages.    


Today, as this is just an introductory session, we will only focus on a sole part of this data flow. If you want to attempt to finish the use case outlined above, please feel free to do so after the session today. Today, we will focus on masking the PII data in the credit cards topic. Under the ksqlDB tab, you should see the provisioned cluster. Click the cluster name and paste the following into the query editor: 
  

```
  CREATE STREAM cards WITH (
    KAFKA_TOPIC = 'agilbert_cards',
    VALUE_FORMAT = 'JSON_SR'
  );
```
  
Make sure you set the property "auto.offset.reset" to Earliest! Click "Run Query". This will create a stream abstraction on top of your cards topic.     
  
Run the following query to mask your PII data (note we have to cast our integer values as strings): 
```
CREATE STREAM cards_pii_obfuscated
    WITH (kafka_topic='cards_pii_obfuscated', value_format='json_sr', partitions=1) AS
    SELECT CARD_ID AS CARD_ID,
           MASK(CAST(CARD_NUMBER AS VARCHAR)) AS CARD_NUMBER,
           MASK(CAST(CVV AS VARCHAR)) AS CVV,
           MASK(CAST(EXPIRATION_DATE AS VARCHAR)) AS EXPIRATION_DATE
    FROM CARDS;
```
Run the following query to view the newly masked data!: 

  
  
```
SELECT * 
FROM CARDS_PII_OBFUSCATED 
EMIT CHANGES;
```

## Monitor your Data Streams Using Stream Lineage 
  
On the left hand menu, select the "Stream Lineage" tab. Here, we can monitor our data flow. You will see the entire data flow we set up is there: connector, topic, ksqlDB query and subsequent topic. We can drill down into different parts of our data flow. 
