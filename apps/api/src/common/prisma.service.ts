import {
  Injectable,
  type OnApplicationShutdown,
  type OnModuleInit,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnApplicationShutdown
{
  constructor() {
    // Plain error messages: they only reach logs, never responses.
    super({ errorFormat: "minimal" });
  }

  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Runs after the HTTP server has stopped and in-flight requests finished
   * (unlike onModuleDestroy, which Nest calls before draining), so a
   * redeploy never cuts a request off from the database mid-way.
   */
  async onApplicationShutdown() {
    await this.$disconnect();
  }
}
