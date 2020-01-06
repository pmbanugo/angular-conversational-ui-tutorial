import { Component } from "@angular/core";
import {
  Message,
  User,
  SendMessageEvent
} from "@progress/kendo-angular-conversational-ui";
import { StreamChat, Channel } from "stream-chat";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent {
  readonly bot: User = {
    id: 0,
    name: "bot"
  };
  user: User = { id: Date.now().toString() };

  messages: Message[] = [
    {
      author: this.bot,
      timestamp: new Date(),
      text: "Hello! Please enter a name in order to start a chat"
    }
  ];

  private conversation: Channel;

  async sendMessage(e: SendMessageEvent): Promise<void> {
    const message = e.message;
    if (!this.user.name) {
      this.user.name = message.text;
      let newMessage = Object.assign({}, message);
      newMessage.text = `Welcome to the chat ${message.text}!`;
      newMessage.author = this.bot;

      await this.initialiseChatClient();
      this.messages = [...this.messages, newMessage];
    } else {
      //TODO: add code to send message in real-time
      this.conversation.sendMessage({ text: message.text });
    }
  }

  async initialiseChatClient(): Promise<void> {
    const response = await fetch("http://localhost:8080/v1/token", {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: this.user.id,
        name: this.user.name
      })
    });
    const streamServerInfo = await response.json();

    this.user.avatarUrl = streamServerInfo.user.image;
    const chatClient = new StreamChat(streamServerInfo.apiKey);
    chatClient.setUser(this.user, streamServerInfo.token);

    this.conversation = chatClient.channel("commerce", "conversational-ui");

    await this.conversation.watch();
    this.conversation.on("message.new", this.onNewMessage);
  }

  onNewMessage = event => {
    let message = {
      text: event.message.text,
      author: event.message.user,
      timestamp: event.message.created_at
    };

    this.messages = [...this.messages, message];
  };
}
