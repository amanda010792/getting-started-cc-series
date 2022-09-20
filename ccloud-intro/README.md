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

Today, we will be provisioning a Basic cluster. Choose Basic and click "Begin Configuration". Select your cloud provider and region of choice. Name your cluster "<YOUR_NAME>-Transactions". Click "Launch Cluster". Within a minute, your cluster should be provisioned! You can also use the [CLI](https://docs.confluent.io/confluent-cli/current/command-reference/kafka/cluster/confluent_kafka_cluster_create.html#confluent-kafka-cluster-create) and [REST API](https://docs.confluent.io/cloud/current/api.html) to provision clusters. 

## Provision a ksqlDB Cluster

ksqlDB is a stream processing tool that allows you to write sql-like syntax to do transformations, joins, filtering and other aggregations against your streaming data. We will be using it today to process mock financial data. As opposed to running aggregations against our data once it's at rest, we can process the data in real-time and get immediate insights before landing it in our downstream systems. Further, while stream processing typically includes writing and maintaing complex code, ksqlDB simplifies the most common data transformations.     

Once your Basic Cluster is provisioned, open the cluster resource and select the ksqlDB tab on the left hand menu. Select the "add cluster" button. Give your cluster "global access" (in production we would lock this down with more granular permissions, but for now we will just use the global access option). Name your cluster "<YOUR_NAME>-ksql" and choose 1 CSU for cluster size (CSUs determine the amount of data that your ksqlDB cluster can process). Click the "Launch Cluster" button. We will come back to this in a later step once the cluster is provisioned. 

## Create Topics 

On your cluster's left hand menu, select the "Topics" tab. Topics are the way Confluent stores data. Each topic is an immutable log of records optionally split into multiple partitions. When developing on Confluent Cloud, you can select your retention period (and even choose to keep data indefinitely!) on a per-topic basis. Today, we will be creating two topics to store mock transaction and credit card data. We will also use Confluent's schema registry to define a schema for our data. There is one Schema Registry per environment, meaning you'll share the Schema Registry instance with other clusters hosted in the same environment. You can choose to serialize your data with AVRO, Protobuf or JSON (Kafka does not require a specific serialization format, but you will have to choose one of these if you want to reap the benefits of the Schema Registry tool).     

Once you are in the topic explorer, select "Add Topic". Name your topic "<YOUR_NAME>-cards" and 



## Create Source Connectors 

## Join Data Streams Using ksqlDB 

## Monitor your Data Streams Using Stream Lineage 
