'use client';

import {
  App,
  Button,
  Card,
  Divider,
  Drawer,
  Input,
  List,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';

import { PayloadCopy } from '@/components/PayloadCopy';
import { VulnBadge } from '@/components/VulnBadge';

interface ArticleListItem {
  id: string;
  title: string;
  category: string;
  commentsCount: number;
}
interface Comment {
  id: string;
  author: string;
  html: string;
  createdAt: string;
}
interface Article {
  id: string;
  title: string;
  category: string;
  bodyHtml: string;
  comments: Comment[];
}

const STORED_XSS_PAYLOAD =
  '<img src=x onerror="alert(\'Сессия: \'+document.cookie)">';

export default function KnowledgeBasePage() {
  const { message } = App.useApp();
  const [list, setList] = useState<ArticleListItem[] | null>(null);
  const [open, setOpen] = useState(false);
  const [article, setArticle] = useState<Article | null>(null);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetch('/api/articles', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setList(d.articles));
  }, []);

  async function openArticle(id: string) {
    setOpen(true);
    setArticle(null);
    const r = await fetch(`/api/articles/${id}`, { credentials: 'include' });
    const d = await r.json();
    setArticle(d.article);
  }

  async function addComment() {
    if (!article || !comment.trim()) return;
    setPosting(true);
    const r = await fetch(`/api/articles/${article.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ html: comment }),
    });
    const d = await r.json();
    setArticle({ ...article, comments: [...article.comments, d.comment] });
    setComment('');
    setPosting(false);
    message.success('Комментарий добавлен — перезагрузите вид, чтобы увидеть рендер');
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <Typography.Title level={3}>База знаний</Typography.Title>
      <VulnBadge title="Stored + DOM XSS — тело статьи и комментарии рендерятся через dangerouslySetInnerHTML" />

      <Card size="small" style={{ marginBottom: 16 }}>
        <Typography.Paragraph style={{ marginBottom: 8 }}>
          Демо Stored XSS: откройте статью, добавьте комментарий с payload —
          он сохранится и выполнится при следующем открытии.
        </Typography.Paragraph>
        <PayloadCopy code={STORED_XSS_PAYLOAD} />
      </Card>

      {!list ? (
        <Spin />
      ) : (
        <List
          grid={{ gutter: 16, column: 2 }}
          dataSource={list}
          renderItem={(a) => (
            <List.Item>
              <Card hoverable onClick={() => openArticle(a.id)} title={a.title}>
                <Tag>{a.category}</Tag>
                <Typography.Text type="secondary">
                  Комментариев: {a.commentsCount}
                </Typography.Text>
              </Card>
            </List.Item>
          )}
        />
      )}

      <Drawer
        width={640}
        open={open}
        onClose={() => setOpen(false)}
        title={article?.title ?? 'Загрузка…'}
      >
        {!article ? (
          <Spin />
        ) : (
          <>
            <Tag>{article.category}</Tag>
            {/* ⚠️ DOM XSS: тело статьи вставляется как сырой HTML */}
            <div
              style={{ marginTop: 16 }}
              dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
            />

            <Divider>Комментарии</Divider>
            <List
              dataSource={article.comments}
              locale={{ emptyText: 'Пока нет комментариев' }}
              renderItem={(c) => (
                <List.Item>
                  <List.Item.Meta
                    title={c.author}
                    description={
                      <>
                        {/* ⚠️ Stored XSS: комментарий рендерится как сырой HTML */}
                        <div dangerouslySetInnerHTML={{ __html: c.html }} />
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {c.createdAt}
                        </Typography.Text>
                      </>
                    }
                  />
                </List.Item>
              )}
            />

            <Input.TextArea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ваш комментарий (HTML не экранируется)"
              style={{ marginTop: 12 }}
            />
            <Button
              type="primary"
              loading={posting}
              onClick={addComment}
              style={{ marginTop: 8 }}
            >
              Отправить
            </Button>
          </>
        )}
      </Drawer>
    </div>
  );
}
