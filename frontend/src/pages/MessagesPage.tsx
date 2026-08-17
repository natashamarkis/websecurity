import { useState, useEffect } from 'react';
import { List, Card, Avatar, Input, Button, message } from 'antd';
import { UserOutlined, SendOutlined } from '@ant-design/icons';
import { Layout } from '@/components/Layout';
import { messagesService } from '@/services/messages';
import type { Message } from '@/services/types';
import { useAuth } from '@/contexts/AuthContext';
import './MessagesPage.scss';

const MessagesPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);

  const loadConversations = async () => {
    try {
      const data = await messagesService.getConversations();
      setConversations(data.conversations);
    } catch (error) {
      message.error('Failed to load conversations');
    }
  };

  const loadMessages = async (userId: number) => {
    setLoading(true);
    try {
      const data = await messagesService.getMessages(userId);
      setMessages(data.messages);
    } catch (error) {
      message.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedUser) return;
    
    try {
      await messagesService.sendMessage(selectedUser.user_id, messageText);
      setMessageText('');
      loadMessages(selectedUser.user_id);
      loadConversations();
    } catch (error) {
      message.error('Failed to send message');
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  return (
    <Layout>
      <div className="messages-page__layout">
        <Card title="Conversations" className="messages-page__conversations">
          <List
            dataSource={conversations}
            renderItem={(conv) => (
              <List.Item
                className={
                  selectedUser?.user_id === conv.user_id
                    ? 'messages-page__conversation messages-page__conversation--active'
                    : 'messages-page__conversation'
                }
                onClick={() => {
                  setSelectedUser(conv);
                  loadMessages(conv.user_id);
                }}
              >
                <List.Item.Meta
                  avatar={<Avatar src={conv.avatar} icon={<UserOutlined />} />}
                  title={conv.username}
                  description={new Date(conv.last_message_time).toLocaleString()}
                />
              </List.Item>
            )}
          />
        </Card>

        <Card
          title={selectedUser ? `Chat with ${selectedUser.username}` : 'Select a conversation'}
          className="messages-page__chat"
        >
          {selectedUser ? (
            <>
              <div className="messages-page__thread">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={
                      msg.from_user_id === user?.id
                        ? 'messages-page__message messages-page__message--outgoing'
                        : 'messages-page__message'
                    }
                  >
                    <div
                      className={
                        msg.from_user_id === user?.id
                          ? 'messages-page__bubble messages-page__bubble--outgoing'
                          : 'messages-page__bubble'
                      }
                    >
                      {msg.text}
                    </div>
                    <div className="messages-page__timestamp">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
              <div className="messages-page__composer">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onPressEnter={handleSendMessage}
                  placeholder="Type a message..."
                  size="large"
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  size="large"
                >
                  Send
                </Button>
              </div>
            </>
          ) : (
            <div className="messages-page__empty">
              Select a conversation to start messaging
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default MessagesPage;
