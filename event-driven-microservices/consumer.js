//websocket consumer
const Kafka = require('node-rdkafka');
const externalConfig = require('dotenv').config();

global.kafkaConf = {
    // Specify the endpoints of the Confluent Cloud  for your instance found under Connection Details on the Instance Details Page
    // Define your variables in a .env file in the same dir as this .js file
    'metadata.broker.list': process.env.METADATA_BROKER_LIST,
    'bootstrap.servers' : process.env.BOOTSTRAP_SERVERS,
    'sasl.mechanisms' : process.env.SASL_MECHANISMS,
    'security.protocol' : process.env.SECURITY_PROTOCOL,
    'sasl.username' : process.env.SASL_USERNAME,
    'sasl.password' : process.env.SASL_PASSWORD
};
console.log(kafkaConf)

let messageHandlers = {} // an key-value map with Kafka Topic Names as key and a reference to a function to handle message consumed from that Topic
const setMessageHandler = function (topic, messageHandlingFunction) {
    messageHandlers[topic] = messageHandlingFunction
}

// this function returns a list of (non-administrative) topics on the cluster
const getTopics = async function () {
    console.log('here')
    const producer = new Kafka.Producer(kafkaConf);
    return new Promise((resolve, reject) => {
        producer.connect()
            .on('ready', function (i, metadata) {
                const clusterTopics = metadata.topics.reduce((topicsList, topic) => {
                    if (!(topic.name.startsWith("__") || topic.name.startsWith("_"))) // do not include internal topics
                        topicsList.push(topic.name)
                    return topicsList
                }, [])
                console.log(`Topics on cluster are ${clusterTopics}`)
                producer.disconnect()
                resolve(clusterTopics)
            })
            .on('event.error', function (err) {
                console.log(err);
                resolve(err)
            });
    })//
}// getTopics
//maybe change above to use api?
let stream
let offsetLatest ="latest"
let offsetEarliest ="earliest"
// consumption is done in a unique consumer group
// initially it reads only new messages on topics; this can be toggled to re-read all messages from the earliest available on the topic
function convertEpochToUTC(timeEpoch){
    var d = new Date(timeEpoch);
    return d.toISOString();
}
// convertEpochToSpecificTimezone(, -5) for ET

function initializeConsumer(topicsToListenTo, readFromBeginning=true) {
    const CONSUMER_GROUP_ID = "kafka-topic-watcher-" + new Date().getTime()
    kafkaConf["group.id"] = CONSUMER_GROUP_ID
    if (stream) {
        stream.consumer.disconnect();
    }

    stream = new Kafka.KafkaConsumer.createReadStream(kafkaConf
        , { "auto.offset.reset": readFromBeginning? offsetEarliest:offsetLatest }, {
        topics: topicsToListenTo
    });
    stream.on('data', function (message) {
      var d = new Date()
      timeEpoch = d.getTime()
      const msgval = message.value?.toString() || '';
      console.log(`Consume started at ${convertEpochToUTC(timeEpoch)}, ${message.topic}: ${msgval} `);
        if (messageHandlers[message.topic]) messageHandlers[message.topic](message)
        else console.log("No message handler is registered for handling mssages on topic ${message.topic}")
    });

    stream.on('error', function (err) {
      var d = new Date()
      timeEpoch = d.getTime()
      console.log(`At ${convertEpochToUTC(timeEpoch)}, Error event on Stream ${err} `);

    });
    console.log(`Stream consumer created to consume (from the beginning) from topic ${topicsToListenTo}`);

    stream.consumer.on("disconnected", function (arg) {
      var d = new Date()
      timeEpoch = d.getTime()
      console.log(`At ${convertEpochToUTC(timeEpoch)}, The stream consumer has been disconnected`)
    });
}//initializeConsumer

module.exports = { initializeConsumer, setMessageHandler, getTopics };
