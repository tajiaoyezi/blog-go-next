package mq

import (
	"fmt"
	"log"
	"sync"

	amqp "github.com/rabbitmq/amqp091-go"
)

const (
	EmailExchange   = "email_exchange"
	EmailQueue      = "email_queue"
	MaxwellExchange = "maxwell_exchange"
	MaxwellQueue    = "maxwell_queue"
)

var (
	conn       *amqp.Connection
	pubChannel *amqp.Channel // 专用于 Publish 的 channel
	conChannel *amqp.Channel // 专用于 Consumer 的 channel
	pubMu      sync.Mutex    // 保护 pubChannel 的并发访问
)

// Init 初始化 RabbitMQ 连接并声明交换机和队列
func Init(url string) {
	var err error
	conn, err = amqp.Dial(url)
	if err != nil {
		log.Fatalf("RabbitMQ 连接失败: %v", err)
	}

	// 生产者专用 channel
	pubChannel, err = conn.Channel()
	if err != nil {
		log.Fatalf("RabbitMQ Publish Channel 创建失败: %v", err)
	}

	// 消费者专用 channel
	conChannel, err = conn.Channel()
	if err != nil {
		log.Fatalf("RabbitMQ Consumer Channel 创建失败: %v", err)
	}

	// 在 pubChannel 上声明交换机和队列
	declareExchangeAndQueue(pubChannel, EmailExchange, EmailQueue)
	declareExchangeAndQueue(pubChannel, MaxwellExchange, MaxwellQueue)

	log.Println("RabbitMQ 初始化完成")
}

func declareExchangeAndQueue(ch *amqp.Channel, exchange, queue string) {
	if err := ch.ExchangeDeclare(exchange, "fanout", true, false, false, false, nil); err != nil {
		log.Fatalf("声明交换机 %s 失败: %v", exchange, err)
	}

	q, err := ch.QueueDeclare(queue, true, false, false, false, nil)
	if err != nil {
		log.Fatalf("声明队列 %s 失败: %v", queue, err)
	}

	if err := ch.QueueBind(q.Name, "", exchange, false, nil); err != nil {
		log.Fatalf("绑定队列 %s 到交换机 %s 失败: %v", queue, exchange, err)
	}
}

// Publish 发布消息到指定交换机（并发安全）
func Publish(exchange string, body []byte) error {
	pubMu.Lock()
	defer pubMu.Unlock()

	if pubChannel == nil {
		return fmt.Errorf("RabbitMQ publish channel 未初始化")
	}
	return pubChannel.Publish(exchange, "", false, false, amqp.Publishing{
		ContentType: "application/json",
		Body:        body,
	})
}

// GetChannel 返回消费者专用 channel
func GetChannel() *amqp.Channel {
	return conChannel
}

// Close 关闭连接
func Close() {
	if pubChannel != nil {
		pubChannel.Close()
	}
	if conChannel != nil {
		conChannel.Close()
	}
	if conn != nil {
		conn.Close()
	}
}
