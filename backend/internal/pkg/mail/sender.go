package mail

import (
	"encoding/json"
	"fmt"
	"log"
	"net/smtp"
	"strings"

	amqp "github.com/rabbitmq/amqp091-go"

	"github.com/tajiaoyezi/blog-go-next/backend/internal/pkg/mq"
)

// EmailDTO 邮件数据传输对象（与原项目消息格式兼容）
type EmailDTO struct {
	Email   string `json:"email"`
	Subject string `json:"subject"`
	Content string `json:"content"`
}

var mailConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
}

// Init 初始化邮件配置
func Init(host string, port int, username, password, from string) {
	mailConfig.Host = host
	mailConfig.Port = port
	mailConfig.Username = username
	mailConfig.Password = password
	mailConfig.From = from
}

// SendAsync 通过 RabbitMQ 异步发送邮件
func SendAsync(email EmailDTO) error {
	body, err := json.Marshal(email)
	if err != nil {
		return fmt.Errorf("序列化邮件数据失败: %w", err)
	}
	return mq.Publish(mq.EmailExchange, body)
}

// StartConsumer 启动邮件消费者（监听 RabbitMQ EmailQueue）
func StartConsumer() {
	ch := mq.GetChannel()
	if ch == nil {
		log.Println("RabbitMQ channel 未就绪，邮件消费者未启动")
		return
	}

	msgs, err := ch.Consume(mq.EmailQueue, "", false, false, false, false, nil)
	if err != nil {
		log.Printf("邮件消费者启动失败: %v", err)
		return
	}

	go func() {
		for msg := range msgs {
			processEmail(msg)
		}
	}()

	log.Println("邮件消费者已启动")
}

func processEmail(msg amqp.Delivery) {
	var dto EmailDTO
	if err := json.Unmarshal(msg.Body, &dto); err != nil {
		log.Printf("解析邮件消息失败: %v", err)
		msg.Nack(false, false)
		return
	}

	if err := sendMail(dto); err != nil {
		log.Printf("发送邮件失败 [%s]: %v", dto.Email, err)
		msg.Nack(false, true) // 重新入队
		return
	}

	log.Printf("邮件发送成功: %s", dto.Email)
	msg.Ack(false)
}

func sendMail(dto EmailDTO) error {
	auth := smtp.PlainAuth("", mailConfig.Username, mailConfig.Password, mailConfig.Host)
	addr := fmt.Sprintf("%s:%d", mailConfig.Host, mailConfig.Port)

	// 构建邮件内容
	header := make(map[string]string)
	header["From"] = mailConfig.From
	header["To"] = dto.Email
	header["Subject"] = dto.Subject
	header["Content-Type"] = "text/html; charset=UTF-8"

	var msgBuilder strings.Builder
	for k, v := range header {
		msgBuilder.WriteString(k + ": " + v + "\r\n")
	}
	msgBuilder.WriteString("\r\n" + dto.Content)

	return smtp.SendMail(addr, auth, mailConfig.From, []string{dto.Email}, []byte(msgBuilder.String()))
}
