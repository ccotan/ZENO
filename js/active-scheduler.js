// UI background work only. No callbacks or scheduled timers while hidden/offline.
const tasks = new Set();
const active = () => !document.hidden && navigator.onLine !== false;
function arm(task, delay) {
  clearTimeout(task.timer);
  task.timer = null;
  if (task.stopped || !active()) return;
  if (task.running) {
    task.again = true;
    return;
  }
  task.timer = setTimeout(async () => {
    task.timer = null;
    if (task.stopped || !active()) return;
    task.running = true;
    task.again = false;
    try {
      await task.run();
    } catch {
      console.warn("[ZENO scheduler] task-unavailable");
    } finally {
      task.running = false;
      if (!task.stopped) arm(task, task.again ? 0 : task.interval);
    }
  }, delay);
}
export function activeTask(run, interval) {
  const task = {
    run,
    interval,
    timer: null,
    running: false,
    again: false,
    stopped: false,
  };
  tasks.add(task);
  arm(task, 0);
  return {
    wake() {
      arm(task, 0);
    },
    stop() {
      task.stopped = true;
      clearTimeout(task.timer);
      tasks.delete(task);
    },
  };
}
function sync() {
  for (const task of tasks) {
    if (active()) arm(task, 0);
    else {
      clearTimeout(task.timer);
      task.timer = null;
      task.again = false;
    }
  }
}
document.addEventListener("visibilitychange", sync);
window.addEventListener("online", sync);
window.addEventListener("offline", sync);
window.addEventListener("pageshow", sync);
