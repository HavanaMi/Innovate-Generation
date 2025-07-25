<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Innovate Generation</title>
  <link rel="stylesheet" href="style.css">
  <style>
    /* Title Center Alignment */
    h1, h2, h3, h4 {
      text-align: center;
    }

    /* Featured Product Section */
    #featured-products {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding: 20px;
      background-color: #111;
    }

    .product-item {
      width: 22%;
      text-align: center;
      background: #1f1f1f;
      border-radius: 8px;
      padding: 20px;
      color: #fff;
      box-shadow: 0 0 10px rgba(255,255,255,0.1);
    }

    .product-item img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 4px;
      margin-bottom: 10px;
    }

    .product-item button {
      background-color: #007acc;
      color: #fff;
      padding: 10px 20px;
      border-radius: 5px;
      border: none;
      cursor: pointer;
    }

    .product-item button:hover {
      background-color: #005f99;
    }

    /* Nikola Featured Section */
    #nikola-award {
      margin-top: 40px;
      text-align: center;
      padding: 20px;
      background-color: #222;
      color: #fff;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    #nikola-award h3 {
      font-size: 2em;
      margin-bottom: 20px;
    }

    #nikola-award p {
      font-size: 1.2em;
      margin-bottom: 20px;
      width: 60%;
    }

    #nikola-award img {
      width: 200px;
      height: 200px;
      object-fit: cover;
      border-radius: 50%;
      margin-bottom: 20px;
    }

    /* Events Section */
    #events {
      margin-top: 40px;
      padding: 20px;
      background-color: #111;
    }

    #events h3 {
      font-size: 2em;
      text-align: center;
      color: #fff;
    }

    #events ul {
      list-style-type: none;
      padding: 0;
      color: #fff;
    }

    #events ul li {
      font-size: 1.2em;
      margin-bottom: 10px;
    }

    #events ul li a {
      color: #fff;
      text-decoration: underline;
    }

    #events ul li a:hover {
      color: #ffcc00;
    }

    /* Support Section */
    #support {
      margin-top: 40px;
      text-align: center;
      padding: 40px;
      background-color: #222;
      color: #fff;
    }

    #support button {
      background-color: #007acc;
      color: #fff;
      padding: 12px 20px;
      border-radius: 5px;
      border: none;
      cursor: pointer;
    }

    #support button:hover {
      background-color: #005f99;
    }

    /* Poll Section */
    #poll {
      margin-top: 40px;
      padding: 20px;
      background-color: #111;
      text-align: center;
    }

    #poll h4 {
      font-size: 2em;
      margin-bottom: 20px;
      color: #fff;
    }

    #poll form {
      margin-bottom: 20px;
    }

    #poll input[type="radio"] {
      margin-right: 10px;
    }

    /* Footer Section */
    footer {
      margin-top: 40px;
      padding: 20px;
      background-color: #1a1a1a;
      text-align: center;
      color: #fff;
    }
  </style>
</head>
<body>

  <header>
    <h1>Innovate Generation</h1>
    <p>Social Innovation. Real Impact.</p>
  </header>

  <!-- Navigation Menu -->
  <nav>
    <a href="index.html">Home</a>
    <a href="about.html">About</a>
    <a href="portfolio.html">Portfolio</a>
    <a href="shop.html">Shop</a>
    <a href="contact.html">Contact</a>
  </nav>

  <!-- Home Section -->
  <section id="home">
    <h1>Welcome to Innovate Generation</h1>
    <p>This is the official website of Innovate Generation – a company dedicated to social initiatives and positive change.</p>
  </section>

  <!-- Nikola Featured Section -->
  <section id="nikola-award">
    <div>
      <h3>Featured Talent of the Year: Nikola</h3>
      <p>Every year, we honor individuals who have made significant progress in their field. This year, we are proud to award Nikola for her remarkable achievements in the arts. Her work at the end of the school year was exceptional, and we are excited to recognize her dedication and creativity.</p>
    </div>
    <img src="images/nikola-photo.jpg" alt="Nikola's Photo">
  </section>

  <!-- Featured Products Section -->
  <section id="featured-products">
    <div class="product-item">
      <img src="https://via.placeholder.com/200x200?text=Product+1" alt="Product 1">
      <h3>Product 1</h3>
      <p>Price: $25</p>
      <button>Shop</button>
    </div>
    <div class="product-item">
      <img src="https://via.placeholder.com/200x200?text=Product+2" alt="Product 2">
      <h3>Product 2</h3>
      <p>Price: $40</p>
      <button>Shop</button>
    </div>
    <div class="product-item">
      <img src="https://via.placeholder.com/200x200?text=Product+3" alt="Product 3">
      <h3>Product 3</h3>
      <p>Price: $15</p>
      <button>Shop</button>
    </div>
    <div class="product-item">
      <img src="https://via.placeholder.com/200x200?text=Product+4" alt="Product 4">
      <h3>Product 4</h3>
      <p>Price: $30</p>
      <button>Shop</button>
    </div>
  </section>

  <!-- Events Section -->
  <section id="events">
    <h3>Upcoming Events</h3>
    <ul>
      <li><a href="https://www.eventbrite.com" target="_blank">Fashion Event - 2025-07-01</a></li>
      <li><a href="https://www.ticketmaster.com" target="_blank">Art Gallery Showcase - 2025-08-15</a></li>
      <li><a href="https://www.eventbrite.com" target="_blank">Music Festival - 2025-09-10</a></li>
    </ul>
  </section>

  <!-- Support Section -->
  <section id="support">
    <p>If you would like to support our educational programs, events, and the promotion of young talents, please consider donating or getting involved.</p>
    <button>Support Our Cause</button>
  </section>

  <!-- Poll Section -->
  <section id="poll">
    <h4>Which event would you most like to see?</h4>
    <form>
      <label><input type="radio" name="event" value="fashion"> Fashion Event</label><br>
      <label><input type="radio" name="event" value="art"> Art Gallery</label><br>
      <label><input type="radio" name="event" value="music"> Music Event</label><br>
      <button type="submit">Vote</button>
    </form>
  </section>

  <!-- Footer -->
  <footer>
    <p>&copy; 2025 Innovate Generation. All rights reserved.</p>
  </footer>

</body>
</html>
            modal.style.display = 'none';
        }
    });
};
