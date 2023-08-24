import express, { Express, Request, Response } from "express";

const app: Express = express();
const port = process.env.PORT || "8888";

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

const store: { tasks: Task[] } = {
  tasks: [],
};

class Task {
  id: number;
  _content: string;
  keywords: string[];

  generateKeywords() {
    this.keywords = [String(this.id), ...this._content.split(" ")];
  }

  constructor(content: string) {
    this.id = Date.now();
    this._content = content;
    this.keywords = [];
    this.generateKeywords();
  }

  set content(taskContent: string) {
    this._content = taskContent;
    this.generateKeywords();
  }

  get content() {
    return this._content;
  }

  toJSON() {
    return {
      id: this.id,
      content: this.content,
    };
  }
}

const OK = "OK";
const ERROR = "ERROR";

class AppResponse {
  status: string;
  data: any;
  message: string;
  constructor(status = OK, data: any) {
    this.status = status;
    this.data = data || {};
    this.message = "";
  }

  setMessage(msg: string = "") {
    this.message = msg;
    return this;
  }

  toJSON() {
    return {
      status: this.status,
      data: this.data,
    };
  }
}

app.get("/", (req: Request, res: Response) => {
  res.send("OK");
});

app.get("/task", (req: Request, res: Response) => {
  const keyword = req.query.k;
  if (keyword) {
    const filteredTasks = store.tasks.filter((task) =>
      Array.isArray(keyword)
        ? keyword.some((word) => task.keywords.includes(word as string))
        : task.keywords.includes(keyword as string)
    );
    if (filteredTasks.length) {
      res
        .status(400)
        .json(
          new AppResponse(ERROR, filteredTasks).setMessage(
            "Could not get any tasks about this keyword: " + keyword
          )
        );
    } else res.json(new AppResponse(OK, filteredTasks));
  } else res.json(new AppResponse(OK, store.tasks));
});

app.post("/task", (req: Request, res: Response) => {
  const body = req.body;
  console.log({ body });
  if (body) {
    const task = new Task(body.content);
    store.tasks.push(task);
    res.send("OK");
  } else {
    res.status(400).send("error input! Task must has description.");
  }
});

app.put("/task/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const body = req.body;
  if (body.content) {
    if (id > 0) {
      const targetTask = store.tasks.find((task) => task.id === id);
      if (targetTask) {
        targetTask.content = body.content;
      }
    } else {
      res.status(400).send(`Task id: [${id}] cannot be found.`);
    }
  } else {
    res.status(400).send("error input! Task must has description.");
  }
});

app.delete("/task/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (id > 0) {
    const targetTaskIndex = store.tasks.findIndex((task) => task.id === id);
    if (targetTaskIndex >= 0) {
      store.tasks = [
        ...store.tasks.slice(0, targetTaskIndex),
        ...store.tasks.slice(targetTaskIndex + 1),
      ];
      res.send("Success!");
    } else {
      res.status(400).send(`Task id: [${id}] cannot be found.`);
    }
  } else {
    res.status(400).send("error input! task id should be number.");
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
