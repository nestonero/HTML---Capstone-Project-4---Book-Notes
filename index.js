
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express ();
const port = 3000;
         

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "Book_list",   // include your pg Admin database
  password: "",            // include your pg Admin password
  port: 5432,
});
db.connect();



// CREATE TABLE books (
//     id SERIAL PRIMARY KEY,
//      title TEXT NOT NULL,
//      content TEXT NOT NULL,
//     published_date DATE,
//     image_url VARCHAR(2048),
//     rating INT CHECK (rating >= 1 AND rating <= 10)
// );

// INSERT INTO books(id, title, content, published_date ,image_url, rating) VALUES (1, 'The Rise of Decentralized Finance','Decentralized Finance (DeFi) is an emerging and rapidly evolving field in the blockchain industry. It refers to the shift from traditional, centralized financial systems to peer-to-peer finance enabled by decentralized technologies built on Ethereum and other blockchains','2023-08-01','https://images.unsplash.com/photo-1778664305530-932cdd6bc6e4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D', 6 );





// In-memory data store
let books = [
  {
    id: 1,
    title: "The Rise of Decentralized Finance",
    content:
      "Decentralized Finance (DeFi) is an emerging and rapidly evolving field in the blockchain industry. It refers to the shift from traditional, centralized financial systems to peer-to-peer finance enabled by decentralized technologies built on Ethereum and other blockchains. With the promise of reduced dependency on the traditional banking sector, DeFi platforms offer a wide range of services, from lending and borrowing to insurance and trading.",
    author: "Alex Thompson",
    date: "2023-08-01T10:00:00Z",
  },
  {
    id: 2,
    title: "The Impact of Artificial Intelligence on Modern Businesses",
    content:
      "Artificial Intelligence (AI) is no longer a concept of the future. It's very much a part of our present, reshaping industries and enhancing the capabilities of existing systems. From automating routine tasks to offering intelligent insights, AI is proving to be a boon for businesses. With advancements in machine learning and deep learning, businesses can now address previously insurmountable problems and tap into new opportunities.",
    author: "Mia Williams",
    date: "2023-08-05T14:30:00Z",
  },
  {
    id: 3,
    title: "Sustainable Living: Tips for an Eco-Friendly Lifestyle",
    content:
      "Sustainability is more than just a buzzword; it's a way of life. As the effects of climate change become more pronounced, there's a growing realization about the need to live sustainably. From reducing waste and conserving energy to supporting eco-friendly products, there are numerous ways we can make our daily lives more environmentally friendly. This post will explore practical tips and habits that can make a significant difference.",
    author: "Samuel Green",
    date: "2023-08-10T09:15:00Z",
  },
];


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


let lastId = 3;



//W

const currentISOString = new Date().toISOString();
console.log(currentISOString);



app.get("/", async (req, res) => 

 {
  try {
    // const result = await db.query("SELECT * FROM books ORDER BY id ASC");
      const result = await db.query("SELECT * FROM books ORDER BY rating DESC, published_date DESC");
     
    books = result.rows;
    console.log(books);
    console.log(books[0]["published_date"]);

    res.render("index.ejs", {
      listTitle: "Today",
      posts:books,
    });
  } catch (err) {
    console.log(err);
  }
});




// Route to render the new postpage
app.get("/new", async(req, res) => {
  res.render("modify.ejs", { heading: "New Post", submit: "Create Post" });
});


// //CHALLENGE 2:PATCH a specific post by id
app.post('/posts/:id', async (req, res) => {
    const postId = parseInt(req.params.id);
    
    // Construct the Open Library cover image URL string directly
    const bookIdTypeUppercase = req.body.book_id_type.toUpperCase();
    const bookId = req.body.book_id;
    const coverUrl = `https://covers.openlibrary.org/b/${bookIdTypeUppercase}/${bookId}-S.jpg`;
  

    const editPost = {
        title: req.body.title,
        content: req.body.content,
        published_date: new Date().toISOString(),
        book_id_type: req.body.book_id_type,
        book_id: bookId,
        rating: req.body.rating,
        author: req.body.author,
        image_url: coverUrl,
    };

    const items = [
        editPost.title,
        editPost.content,
        editPost.published_date,
        editPost.book_id_type,
        editPost.book_id,
        editPost.rating,
        editPost.author,
        editPost.image_url,
        postId 
    ];

    try {
        // 1. Update the database first
        await db.query(
            `UPDATE books SET title = $1, content = $2, published_date = $3, book_id_type = $4, book_id = $5, rating = $6, author = $7, image_url = $8 WHERE id = $9`,
            items
        );

      
        
        // Option B: If you just want to redirect back home after updating (Uncomment below and comment out Option A):
        res.redirect('/');
// 
    } catch (err) {
        console.error("Error processing update:", err.message);
        res.status(500).render("index.ejs", { error: err.message });
    }
});



// //CHALLENGE 3: POST a new post

app.post("/posts", async (req, res) => {
  console.log(req.body);

    // Construct the Open Library cover image URL string directly
    const bookIdTypeUppercase = req.body.book_id_type.toUpperCase();
    const bookId = req.body.book_id;
    const coverUrl = `https://covers.openlibrary.org/b/${bookIdTypeUppercase}/${bookId}-S.jpg`;
  


  const newPost = {
    title: req.body.title,
    content: req.body.content,
    published_date: currentISOString,
    book_id_type: req.body.book_id_type,
    book_id: req.body.book_id,
    rating: req.body.rating,
    author: req.body.author,
    image_url: coverUrl
  };

  // Reordered to match the columns in the SQL statement:
  // (title, content, published_date, book_id, book_id_type, rating, author)
  const items = [
    newPost.title,          // $1
    newPost.content,        // $2
    newPost.published_date, // $3
    newPost.book_id,        // $4 (Matches book_id)
    newPost.book_id_type,   // $5 (Matches book_id_type)
    newPost.rating,         // $6
    newPost.author,          // $7
    newPost.image_url,       //$8
  ];

  try {
    await db.query(
      "INSERT INTO books (title, content, published_date, book_id, book_id_type, rating, author,image_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      items
    );
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error"); // Friendly fallback error for the client
  }
});




// //CHALLENGE 4: PATCH a post when you just want to update one parameter

app.get("/edit/:id", (req, res) => {
  const id = parseInt(req.params.id);
  
  // Find the specific book that matches the URL parameter ID
  const postToEdit = books.find(book => book.id === id);

  // Handle case where the book ID doesn't exist
  if (!postToEdit) {
    return res.status(404).send("Post not found");
  }

  // Pass the single post object to your template
  res.render("modify.ejs", { 
    heading: "Edit Post", 
    submit: "Save",
    post: postToEdit 
  });
});

// //CHALLENGE 5: DELETE a specific post by providing the post id.

app.get("/posts/delete/:id", async(req, res) => {
  const id = parseInt(req.params.id);
 
  console.log(id);

    try {
    await db.query("DELETE FROM books WHERE id = $1", [id]);
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }



});





app.listen(port, () => {
  console.log(`API is running at http://localhost:${port}`);
});
