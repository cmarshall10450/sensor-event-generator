const express = require('express')
const {
    EventHubProducerClient
} = require('@azure/event-hubs')

require('dotenv').config()

const app = express()
const port = 3000

const eventsPerSecond = 1
const eventInterval = 1000 / eventsPerSecond
const sensorCount = 10
const spikeChance = 0.01

const producer = new EventHubProducerClient(
    process.env.EVH_CONNECTION_STRING,
    process.env.EVH_NAME
)

app.listen(port, () =>
    setInterval(async () => {
        const batch = await producer.createBatch()
        const events = Array.from(Array(sensorCount), (_, i) => {
            const shouldSpike = Math.random() < spikeChance
            return {
                body: {
                    id: `sensor_${i}`,
                    value: (Math.random() * 41 - 10 + (shouldSpike ? 100 : 0)).toFixed(2),
                    createdAt: new Date(),
                },
            }
        })

        events.forEach((e) => batch.tryAdd(e))
        await producer.sendBatch(batch)
        console.log(JSON.stringify(events))
    }, eventInterval)
)