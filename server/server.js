const mongoose = require("mongoose");
const Document = require("./Document");
const mongoAtlasUri = "yourMongoAtlasUri";
try {
  mongoose.connect(encodeURI(mongoAtlasUri), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  });
} catch (e) {
  console.log("could not connect");
}

const io = require("socket.io")(3005, {
  cors: {
    origin: "http://localhost:3006",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document.data);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("recive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

const defaultValue = "";

async function findOrCreateDocument(id) {
  if (id == null) return;
  const document = await Document.findById(id);
  if (document) return document;

  return await Document.create({
    _id: id,
    data: defaultValue,
  });
}
