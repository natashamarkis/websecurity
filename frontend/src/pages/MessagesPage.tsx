import { useState, useEffect } from 'react';
import { List, Card, Avatar, Input, Button, message } from 'antd';
import { UserOutlined, SendOutlined } from '@ant-design/icons';
import { Layout } from '@/components/Layout';
import { messagesService } from '@/services/messages';
import type { Message } from '@/services/types';
import { useAuth } from '@/contexts/AuthContext';

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
      <div style={{ display: 'flex', gap: '24px', height: '70vh' }}>
        <Card title="Conversations" style={{ flex: '0 0 300px', overflowY: 'auto' }}>
          <List
            dataSource={conversations}
            renderItem={(conv) => (
              <List.Item
                style={{ cursor: 'pointer', background: selectedUser?.user_id === conv.user_id ? '#1890ff22' : 'transparent' }}
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
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          {selectedUser ? (
            <>
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      marginBottom: '12px',
                      textAlign: msg.from_user_id === user?.id ? 'right' : 'left',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: msg.from_user_id === user?.id ? '#1890ff' : '#fff',
                        color: msg.from_user_id === user?.id ? '#fff' : '#000',
                        maxWidth: '70%',
                      }}
                    >
                      {msg.text}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
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
            <div style={{ textAlign: 'center', padding: '50px', color: '#888' }}>
              Select a conversation to start messaging
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default MessagesPage;
