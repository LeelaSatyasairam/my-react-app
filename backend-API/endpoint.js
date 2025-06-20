import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";
import jwt from "jsonwebtoken";
import cors from "cors"

env.config()

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const port = process.env.PORT;
app.use(cors({
  origin: process.env.ORIGIN
}))

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: 5432,
    ssl: {
    rejectUnauthorized: false
  },
});

db.connect();

// login to website
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await db.query(`SELECT * FROM Login WHERE username = $1 AND password =$2`, [username, password]);
    const user = result.rows[0];

    if (!user || user.username !== username || user.password !== password) {
      return res.status(401).json({ message: "username or password invalid" });
    } else {

      res.status(200).json({
        status: "success",
        data: result.rows
      })
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "failure",
      message: "Database error",
    });
  }
})

// login to website
app.get("/detail", async (req, res) => {
  const username = req.query.username;
  const personid = req.query.personid;
  try {
    const result = await db.query(`SELECT * FROM Login WHERE username = $1 AND personid =$2`, [username, personid]);
    res.status(200).json({
      status: "success",
      data: result.rows[0]
    })
  }
  catch (err) {
    console.log(err);
    res.status(500).json({
      status: "failure",
      message: "Database error",
    });
  }
})

// register to website
app.post("/register", async (req, res) => {
  const { username, password } = req.body

  try {
    // Check if username already exists
    const existingUser = await db.query(
      "SELECT * FROM login WHERE username = $1",
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        status: "failure",
        message: "Username already exists",
      });
    }
    // Step 1: Insert the user (without token initially)
    const result = await db.query(
      `INSERT INTO Login (username, password) VALUES ($1, $2) RETURNING *`,
      [username, password]
    );

    const user = result.rows[0];

    // Step 2: Generate a JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
    );

    // Step 3: Update the user with the token
    await db.query(
      `UPDATE Login SET token = $1 WHERE id = $2 RETURNING *`,
      [token, user.id]
    );
    const updatedUserResult = await db.query(
      `SELECT * FROM Login WHERE id = $1`,
      [user.id]
    );

    // Step 4: Return the response
    res.status(201).json({
      status: "success",
      data: updatedUserResult.rows[0],
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "failure",
      message: "Database error",
    });
  }
});

// Get All expense categories 
app.get("/categories", async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM expensecategeries`);
    res.status(200).json({
      status: "success",
      data: result.rows,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "failure",
      message: "Database error",
    });
  }
});

// Get All expense categories by personid
app.get("/categories/:personid", async (req, res) => {
  const personid = req.params.personid
  try {
    const result = await db.query(`SELECT * FROM expensecategeries WHERE personid =$1`, [personid]);
    res.status(200).json({
      status: "success",
      data: result.rows,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "failure",
      message: "Database error",
    });
  }
});

// Get single expense categories by id
app.get("/category", async (req, res) => {
  const Id = req.query.id
  try {
    const result = await db.query(`SELECT * FROM expensecategeries WHERE id =$1 `, [Id]);
    res.status(200).json({
      status: "success",
      data: result.rows,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "failure",
      message: "Database error",
    });
  }
});

// Get name colummn from expense categories
app.get("/categories-name/:personid", async (req, res) => {
  const personid = req.params.personid;
  try {
    const result = await db.query(`SELECT name FROM expensecategeries WHERE personid =$1`, [personid]);
    res.status(200).json({
      status: "success",
      data: result.rows,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "failure",
      message: "Database error",
    });
  }
});

// create new expense categories
app.post("/category-new", async (req, res) => {
  const { name, description, personid } = req.body
  try {
    const result = await db.query(`INSERT INTO expensecategeries(name, description,personid) VALUES ($1, $2,$3) RETURNING *`, [name, description, personid]);
    res.status(201).json({
      status: "success",
      data: result.rows[0],
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "failure",
      message: "Database error",
    });
  }
});

app.put("/category-edit", async (req, res) => {
  const { id, name, description } = req.body;
  if (!id || !name || !description) {
    return res.status(400).json({ error: "id, name, and description are required" });
  }
  try {
    const result = await db.query(
      `UPDATE expensecategeries
       SET name = $1, description = $2
       WHERE id = $3
       RETURNING *`,
      [name, description, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.status(200).json({ message: "Category updated successfully", data: result.rows[0] });
  } catch (err) {
    console.error("PUT error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete expense category
app.delete("/category", async (req, res) => {
  const Id = req.query.id;

  try {
    const result = await db.query(
      `DELETE FROM expensecategeries WHERE id = $1 RETURNING *`,
      [Id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.status(200).json({
      status: "success",
      data: result.rows[0]  // Returning deleted record
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "failure",
      error: 'Database error'
    });
  }
});


// Get all expensetype
app.get("/expensetypes", async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM expensetype`);
    res.status(200).json({
      status: "success",
      data: result.rows,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "failure",
      message: "Database error",
    });
  }
});



// Get all expensetype by person id
app.get("/expensetypes/:personid", async (req, res) => {
  const personid = req.params.personid
  try {
    const result = await db.query(`SELECT * FROM expensetype WHERE personid =$1`, [personid]);
    res.status(200).json({
      status: "success",
      data: result.rows,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "failure",
      message: "Database error",
    });
  }
});

// Get single expensetype by id
app.get("/expensetype", async (req, res) => {
  const Id = req.query.id
  try {
    const result = await db.query(`SELECT * FROM expensetype WHERE id =$1`, [Id]);
    res.status(200).json({
      status: "success",
      data: result.rows,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "failure",
      message: "Database error",
    });
  }
});

// Get name & categorytype colummn from expensetype
app.get("/expensetypes-name-type", async (req, res) => {
  const personid = req.query.personid
  try {
    const result = await db.query(`SELECT categorytype,name FROM expensetype WHERE personid=$1`, [personid]);
    res.status(200).json({
      status: "success",
      data: result.rows,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "failure",
      message: "Database error",
    });
  }
});

// create new expensetype
app.post("/expensetype-new", async (req, res) => {
  const { categorytype, name, personid } = req.body
  try {
    const result = await db.query(`INSERT INTO expensetype(categorytype,name,personid) VALUES ($1, $2,$3) RETURNING *`, [categorytype, name, personid]);
    res.status(201).json({
      status: "success",
      data: result.rows[0],
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "failure",
      message: "Database error",
    });
  }
});

// edit  expensetype
app.put("/expensetype-edit", async (req, res) => {
  const { id, categorytype, name } = req.body;

  if (!id || !categorytype || !name) {
    return res.status(400).json({ error: "id, category, and name are required" });
  }
  try {
    const result = await db.query(`UPDATE expensetype 
      SET categorytype =$1,name =$2 
      WHERE id =$3 RETURNING *`,
      [categorytype, name, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "expensetype not found" });
    }
    res.status(200).json({ message: "expensetype updated successfully", data: result.rows[0] });;
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" })
  }
});

// Delete expensetype
app.delete("/expensetype", async (req, res) => {
  const Id = req.query.id;

  try {
    const result = await db.query(
      `DELETE FROM expensetype WHERE id = $1 RETURNING *`,
      [Id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.status(200).json({
      status: "success",
      data: result.rows[0]  // Returning deleted record
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "failure",
      error: 'Database error'
    });
  }
});


// Get all expenses
app.get("/expenses", async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM expenses`);
    res.status(200).json({
      status: "success",
      data: result.rows,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "failure",
      message: "Database error",
    });
  }
});


// Get all expenses by personid
app.get("/expenses/:personid", async (req, res) => {
  const personid = req.params.personid
  try {
    const result = await db.query(`SELECT * FROM expenses WHERE personid =$1`, [personid]);
    res.status(200).json({
      status: "success",
      data: result.rows,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "failure",
      message: "Database error",
    });
  }
});

//get expense by id
app.get("/expense", async (req, res) => {
  const id = req.query.id;
  try {
    const result = await db.query(`SELECT * FROM expenses  WHERE id =$1`, [id]);
    if (result.rowCount == 0) {
      res.status(400).json({ message: "expense type is not found" })
    }
    res.status(200).json({
      message: "success",
      data: result.rows[0]
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({
      message: "Internal sever error"
    })

  }
})


// create new expense
app.post("/expense-new", async (req, res) => {
  const { expensecategorytype, expensetype, description, amount, personid } = req.body
  try {
    const result = await db.query(`INSERT INTO expenses (expensecategorytype,expensetype,description,amount,personid) VALUES ($1, $2,$3,$4,$5) RETURNING *`, [expensecategorytype, expensetype, description, amount, personid]);
    res.status(201).json({
      status: "success",
      data: result.rows[0],
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "failure",
      message: "Database error",
    });
  }
});

// edit expense
app.put("/expense-edit", async (req, res) => {
  const { id, expensecategorytype, expensetype, description, amount } = req.body;

  if (!id || !expensecategorytype || !expensetype || !description || !amount) {
    res.status(400).json({ error: "id, category,categorytype, decription and are required" })
  } try {
    const result = await db.query(`UPDATE expenses 
      SET expensecategorytype =$1, 
      expensetype =$2, 
      description =$3, 
      amount=$4 
      WHERE id =$5 RETURNING *`,
      [expensecategorytype, expensetype, description, amount, id]);

    console.log(result.rows[0])
    if (result.rowCount === 0) {
      res.status(400).json({
        error: "expensetype not found"
      })
    };
    res.status(200).json({
      message: "success",
      data: result.rows[0]
    })
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Internal server error"
    })
  }
})

// Delete expenses
app.delete("/expense", async (req, res) => {
  const Id = req.query.id;

  try {
    const result = await db.query(
      `DELETE FROM expenses WHERE id = $1 RETURNING *`,
      [Id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.status(200).json({
      status: "success",
      data: result.rows[0]  // Returning deleted record
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "failure",
      error: 'Database error'
    });
  }
});


app.listen(port, () =>
  console.log(`REST API running at http://localhost:${port}`)
);
