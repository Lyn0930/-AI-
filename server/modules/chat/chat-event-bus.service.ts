import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import { Subject, Observable } from 'rxjs';
import type { ChatMessage, ChatSession } from '@shared/api.interface';

/**
 * 客服工作台实时事件总线（SSE 后端）
 *
 * 设计：
 * - 单进程内存总线（够用：单 Nest 进程 + 单 Postgres）
 * - 维护 userId -> Subject 的映射，每个登录的客服一个独立的 Observable
 * - 事件按「相关性」过滤：
 *     - session.event：与该 user 相关的所有会话变更（含 claim、release、mode 切换、新消息）
 *     - pool.event：「未分配 + human 模式」的会话变更（任何在线客服都关心）
 * - 客户端订阅 /api/chat/events，前端 EventSource 自动重连
 */

export type AgentChatEvent =
  | { type: 'session.created'; session: ChatSession }
  | { type: 'session.updated'; session: ChatSession }
  | { type: 'message.created'; sessionId: string; message: ChatMessage }
  | { type: 'ping'; ts: number };

@Injectable()
export class ChatEventBus implements OnModuleDestroy, OnModuleInit {
  private readonly logger = new Logger(ChatEventBus.name);
  private readonly emitter = new EventEmitter();
  private readonly userSubjects = new Map<string, Subject<AgentChatEvent>>();
  private heartbeatTimer: NodeJS.Timeout | null = null;

  onModuleInit(): void {
    this.heartbeatTimer = setInterval(() => {
      const ts = Date.now();
      for (const subject of this.userSubjects.values()) {
        if (!subject.closed) {
          subject.next({ type: 'ping', ts });
        }
      }
    }, 25_000);
    this.logger.log('SSE 心跳已启动（25s 间隔，防代理/网关闲置切断）');
  }

  // 1. 客服上线：注册一个 subject
  registerUser(userId: string): Observable<AgentChatEvent> {
    let subject = this.userSubjects.get(userId);
    if (!subject) {
      subject = new Subject<AgentChatEvent>();
      this.userSubjects.set(userId, subject);
      this.logger.log(`客服 ${userId} 已订阅实时事件`);
    }
    return subject.asObservable();
  }

  // 2. 客服下线：清理 subject
  unregisterUser(userId: string): void {
    const subject = this.userSubjects.get(userId);
    if (subject) {
      subject.complete();
      this.userSubjects.delete(userId);
      this.logger.log(`客服 ${userId} 已取消订阅`);
    }
  }

  // 3. 给指定客服发事件
  emitToUser(userId: string, event: AgentChatEvent): void {
    const subject = this.userSubjects.get(userId);
    if (subject && !subject.closed) {
      subject.next(event);
    }
  }

  // 4. 给所有在线客服发事件（用于「未分配 + human」抢单场景）
  emitToAll(event: AgentChatEvent): void {
    for (const subject of this.userSubjects.values()) {
      if (!subject.closed) {
        subject.next(event);
      }
    }
  }

  // 5. 心跳：每 25s 推一个 ping，防止代理/网关 30s 闲置超时切断
  startHeartbeat(): void {
    setInterval(() => {
      const ts = Date.now();
      for (const subject of this.userSubjects.values()) {
        if (!subject.closed) {
          subject.next({ type: 'ping', ts });
        }
      }
    }, 25_000);
  }

  onModuleDestroy(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    for (const subject of this.userSubjects.values()) {
      subject.complete();
    }
    this.userSubjects.clear();
  }
}
