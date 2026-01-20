import { defineStore } from "pinia";
import { checkHealth } from "@/services/api";

interface ConnectionState {
  isConnected: boolean;
  latencyMs: number | null;
  lastCheckedAt: number | null;
  isChecking: boolean;
  isStarting: boolean;
  errorMessage: string;
  modelName: string;
}

let connectionInterval: number | null = null;

export const useConnectionStore = defineStore("connection", {
  state: (): ConnectionState => ({
    isConnected: false,
    latencyMs: null,
    lastCheckedAt: null,
    isChecking: false,
    isStarting: false,
    errorMessage: "",
    modelName: "",
  }),
  actions: {
    async checkConnection() {
      if (this.isChecking) return;
      this.isChecking = true;
      const start = performance.now();
      try {
        const health = await checkHealth();
        const elapsed = Math.round(performance.now() - start);
        this.isConnected = true;
        this.latencyMs = elapsed;
        this.errorMessage = "";
        this.modelName = health?.model || this.modelName;
      } catch (error) {
        this.isConnected = false;
        this.latencyMs = null;
        this.errorMessage = "无法连接后端";
      } finally {
        this.isChecking = false;
        this.lastCheckedAt = Date.now();
      }
    },
    startAutoCheck(intervalMs = 5000) {
      if (connectionInterval) return;
      this.checkConnection();
      connectionInterval = window.setInterval(() => {
        this.checkConnection();
      }, intervalMs);
    },
    stopAutoCheck() {
      if (!connectionInterval) return;
      window.clearInterval(connectionInterval);
      connectionInterval = null;
    },
    async startBackend() {
      if (this.isStarting || this.isConnected) return;
      this.isStarting = true;
      this.errorMessage = "";

      try {
        const isElectron = Boolean((window as any)?.process?.versions?.electron);
        const electronRequire = (window as any)?.require;
        if (!isElectron || !electronRequire) {
          this.errorMessage = "当前环境不支持自动启动后端，请手动运行 start_backend.ps1。";
          return;
        }

        const path = electronRequire("path");
        const fs = electronRequire("fs");
        const { spawn } = electronRequire("child_process");

        const appRoot = (window as any).process?.cwd ? (window as any).process.cwd() : "";
        if (!appRoot) {
          this.errorMessage = "无法获取项目路径，请手动运行 start_backend.ps1。";
          return;
        }
        const scriptPath = path.resolve(appRoot, "start_backend.ps1");

        if (!fs.existsSync(scriptPath)) {
          this.errorMessage = "未找到 start_backend.ps1，请确认项目目录结构。";
          return;
        }

        spawn(
          "powershell",
          ["-ExecutionPolicy", "Bypass", "-File", scriptPath],
          {
            cwd: appRoot,
            detached: true,
            stdio: "ignore",
          }
        ).unref();

        window.setTimeout(() => {
          this.checkConnection();
        }, 1500);
      } catch (error) {
        this.errorMessage = "启动后端失败，请检查 PowerShell 权限或手动启动。";
      } finally {
        this.isStarting = false;
      }
    },
  },
});
