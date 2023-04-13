const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("./app");

// Configure chai
chai.use(chaiHttp);
chai.should();

describe("User API", () => {
  let token = "";

  before((done) => {
    chai
      .request(app)
      .post("/api/authenticate")
      .send({ username: "testuser", password: "testpassword" })
      .end((err, res) => {
        token = res.body.token;
        done();
      });
  });

  describe("GET /api/user", () => {
    it("should return user profile with name, followers and following count", (done) => {
      chai
        .request(app)
        .get("/api/user")
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("name");
          res.body.should.have.property("followersCount");
          res.body.should.have.property("followingCount");
          done();
        });
    });
  });

  describe("POST api/posts/", () => {
    it("should add a new post created by authenticated user", (done) => {
      chai
        .request(app)
        .post("/api/posts/")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Test Post", description: "This is a test post" })
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("object");
          res.body.should.have.property("postId");
          res.body.should.have.property("title").eq("Test Post");
          res.body.should.have
            .property("description")
            .eq("This is a test post");
          res.body.should.have.property("createdTime");
          done();
        });
    });
  });

  describe("DELETE api/posts/{id}", () => {
    it("should delete post with {id} created by authenticated user", (done) => {
      chai
        .request(app)
        .delete("/api/posts/123")
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });

  describe("POST /api/like/{id}", () => {
    it("should like the post with {id} by the authenticated user", (done) => {
      chai
        .request(app)
        .post("/api/like/123")
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });

  describe("POST /api/unlike/{id}", () => {
    it("should unlike the post with {id} by the authenticated user", (done) => {
      chai
        .request(app)
        .post("/api/unlike/123")
        .set("Authorization", `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          done();
        });
    });
  });
});
