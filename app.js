const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const objResult = (obj) => {
  return {
    id: obj.id,
    todo: obj.todo,
    priority: obj.priority,
  };
};

//API 1 Scenario 1

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.status !== "";
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;
  let status_q = status;
  if (status_q !== "DONE") {
    status_q = status.replace("%20", " ");
  }
  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status_q}'
                AND priority = '${priority}';`;
        }
      }
      break;
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}';`;
      }
      break;
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status_q}';`;
      }
      break;
    case hasSearchProperty(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%';`;
      break;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

// app.get("/todos/", async (request,response) => {
//     const { status } = request.query;
//     const status_q = status.replace("%20"," ");
//     const getTodoQuery = `select * from todo where status = '${status_q}';`;
//     const getTodoQueryResponse = await db.all(getTodoQuery);
//     response.send(getTodoQueryResponse);
// });

// //API 1 Scenario 2

// app.get("/todos/", async (request,response) => {
//     const { priority } = request.query;
//     switch (true){
//       case (priority === "HIGH"):
//         console.log("yes");
//         const getTodoQuery = `
//         select * from todo WHERE priority = '${priority}';`;
//         const getTodoQueryResponse = await db.all(getTodoQuery);
//         response.send(getTodoQueryResponse);
//         break;
//       default:
//         break;
//     };
// });

// // app.get("/todos/", async (request,response) => {
// //     const { priority } = request.query;
// //     const getTodoQuery = `select * from todo where priority = '${priority}';`;
// //     const getTodoQueryResponse = await db.all(getTodoQuery);
// //     response.send(getTodoQueryResponse.map(each => objResult(each)));
// // });

// ///API 1 Scenario 3

// app.get("/todos/", async (request,response) => {
//     const { priority,status } = request.query;
//     const status_q = status.replace("%20"," ");
//     const getTodoQuery = `select * from todo where priority = '${priority}'
//         AND status = '${status_q}';`;
//     const getTodoQueryResponse = await db.all(getTodoQuery);
//     response.send(getTodoQueryResponse);
// });

// ///API 1 Scenario 4

// app.get("/todos/", async (request,response) => {
//     const { search_q = "" } = request.query;
//     console.log("yes");
//     const getTodoQuery = `select * from todo where todo like "%${search_q}%";`;
//     const getTodoQueryResponse = await db.all(getTodoQuery);
//     response.send(getTodoQueryResponse);
// });

//API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `select * from todo where id = ${todoId};`;
  const getTodoQueryResponse = await db.get(getTodoQuery);
  response.send(getTodoQueryResponse);
});

//API 3

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createTodoQuery = `insert into todo(id,
    todo,priority,status) 
    values(${id},'${todo}','${priority}','${status}');`;
  const createTodoQueryResponse = await db.run(createTodoQuery);
  response.send(`Todo Successfully Added`);
});

//API 4

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  const previousTodoQuery = `select * from todo where id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  let updateTodoQuery;
  switch (true) {
    // update status
    case requestBody.status !== undefined:
      const status_q = status.replace("%20", " ");
      updateTodoQuery = `
        UPDATE todo SET todo='${todo}', priority='${priority}', status='${status_q}' WHERE id = ${todoId};`;

      await db.run(updateTodoQuery);
      response.send(`Status Updated`);
      break;

    //update priority
    case requestBody.priority !== undefined:
      updateTodoQuery = `
        UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}' WHERE id = ${todoId};`;

      await db.run(updateTodoQuery);
      response.send(`Priority Updated`);
      break;

    //update todo
    case requestBody.todo !== undefined:
      updateTodoQuery = `
        UPDATE todo SET todo='${todo}', priority='${priority}', status='${status}' WHERE id = ${todoId};`;

      await db.run(updateTodoQuery);
      response.send(`Todo Updated`);
      break;
  }
});

//API 5

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        DELETE FROM
            todo
        WHERE
            id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
