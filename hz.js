// Определяем класс искры
function Firework() {
  // Инициализируем искру
  this.init();
}

// Количество искр
Firework.sparksCount = 200;

// Методы класса Firework
Firework.prototype = {
  // Метод инициализации искры
  init: function () {
    // Время создания искры
    this.timeFromCreation = performance.now();
    this.a = 0.001;
    // Задаем случайное направление полета искры в градусах (от 0 до 360)
    this.angle = Math.random() * 360;

    // Радиус - это расстояние, которое пролетит искра
    this.radius = Math.random() * 3;

    // Вычисляем максимальные координаты искры на окружности
    this.xMax = Math.cos(this.angle) * this.radius;
    this.yMax = Math.sin(this.angle) * this.radius;

    // Вычисляем скорость искры (dx и dy) в зависимости от множителя
    var multiplier = 1000; //25 + Math.random() * 25;
    this.dx = this.xMax / multiplier;
    this.dy = this.yMax / multiplier;

    // Для того, чтобы не все искры начинали движение из начала координат,
    // задаем каждой искре свое начальное положение
    this.x = 0;
    this.y = 0;
  },

  // Метод для перемещения искры
  move: function (time) {
    // Находим разницу между вызовами отрисовки, чтобы анимация работала
    // одинаково на компьютерах разной мощности
    var timeShift = time - this.timeFromCreation;
    this.timeFromCreation = time;

    // Вычисляем скорость искры
    var speed = timeShift;

    // Если искра достигла конечной точки, перезапускаем ее
    if (
      Math.abs(this.x) > Math.abs(this.xMax) ||
      Math.abs(this.y) > Math.abs(this.yMax)
    ) {
      //sparks.splice(sparks.indexOf(this) - 1, sparks.indexOf(this));
    } else {
      // Обновляем координаты искры
      var t = 1.5;
      this.x += this.dx * speed * Math.abs(this.x - this.xMax) * t;
      this.y += this.dy * speed * Math.abs(this.y - this.yMax) * t;
    }
  },
};

// Инициализация WebGL
var canvas = document.getElementById("glCanvasSix");

var gl = canvas.getContext("webgl");
if (!gl) {
  console.error("Unable to initialize WebGL. Your browser may not support it.");
}

// Инициализация программы искр
var programFirework = webglUtils.createProgramFromScripts(gl, [
  "vertex-shader-spark",
  "fragment-shader-spark",
]);
var positionAttributeLocationFirework = gl.getAttribLocation(
  programFirework,
  "a_position"
);
var textureLocationFirework = gl.getUniformLocation(
  programFirework,
  "u_texture"
);
var pMatrixUniformLocationFirework = gl.getUniformLocation(
  programFirework,
  "u_pMatrix"
);
var mvMatrixUniformLocationFirework = gl.getUniformLocation(
  programFirework,
  "u_mvMatrix"
);

// Инициализация программы следов искр
var programTrack = webglUtils.createProgramFromScripts(gl, [
  "vertex-shader-track",
  "fragment-shader-track",
]);
var positionAttributeLocationTrack = gl.getAttribLocation(
  programTrack,
  "a_position"
);
var colorAttributeLocationTrack = gl.getAttribLocation(programTrack, "a_color");
var pMatrixUniformLocationTrack = gl.getUniformLocation(
  programTrack,
  "u_pMatrix"
);
var mvMatrixUniformLocationTrack = gl.getUniformLocation(
  programTrack,
  "u_mvMatrix"
);

// Создание и загрузка текстуры для искр
var texture = gl.createTexture();
var image = new Image();
image.crossOrigin = "anonymous";
image.src = "spark.png";
image.addEventListener("load", function () {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.bindTexture(gl.TEXTURE_2D, null);
  // Начинаем отрисовку сцены только после загрузки изображения
  requestAnimationFrame(drawScene);
});

// Включение смешивания цветов
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

// Инициализация буферов для следов искр
var trackPositionBuffer = gl.createBuffer();
var trackColorBuffer = gl.createBuffer();

// Инициализация буфера для искр
var sparkPositionBuffer = gl.createBuffer();

// Создание необходимых искр
var sparks = [];
for (var i = 0; i < Firework.sparksCount; i++) {
  sparks.push(new Firework());
}

function drawScene(time) {
  // Очищаем канвас
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Устанавливаем матрицы проекции и вида
  var pMatrix = mat4.create();
  var mvMatrix = mat4.create();
  mat4.perspective(pMatrix, 45, canvas.width / canvas.height, 0.1, 100.0);
  mat4.translate(mvMatrix, mvMatrix, [0, 1.0, -7.0]);

  // Обновляем позиции искр
  for (var i = 0; i < sparks.length; i++) {
    sparks[i].move(time);
  }

  // Получаем координаты искр для передачи в функции
  var positions = [];
  sparks.forEach(function (spark) {
    positions.push(spark.x, spark.y, 0);
  });

  // Отрисовка следов искр
  drawTracks(positions, pMatrix, mvMatrix);

  // Отрисовка самих искр
  // drawFireworks(positions, pMatrix, mvMatrix);

  // Продолжаем отрисовку сцены
  requestAnimationFrame(drawScene);
}

function drawTracks(positions, pMatrix, mvMatrix) {
  // Активируем программу следов искр
  gl.useProgram(programTrack);

  // Передаем данные о позициях следов
  var colors = [];
  var positionsFromCenter = [];
  for (var i = 0; i < positions.length; i += 3) {
    positionsFromCenter.push(0, 0, 0);
    positionsFromCenter.push(positions[i], positions[i + 1], positions[i + 2]);
    colors.push(0, 0.1, 0.1);
    colors.push(0.1, 0.1, 0.1);
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, trackPositionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(positionsFromCenter),
    gl.STATIC_DRAW
  );
  gl.enableVertexAttribArray(positionAttributeLocationTrack);
  gl.vertexAttribPointer(
    positionAttributeLocationTrack,
    3,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, trackColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(colorAttributeLocationTrack);
  gl.vertexAttribPointer(colorAttributeLocationTrack, 3, gl.FLOAT, false, 0, 0);

  gl.uniformMatrix4fv(pMatrixUniformLocationTrack, false, pMatrix);
  gl.uniformMatrix4fv(mvMatrixUniformLocationTrack, false, mvMatrix);

  gl.drawArrays(gl.LINES, 0, positionsFromCenter.length / 3);
}

function drawFireworks(positions, pMatrix, mvMatrix) {
  // Активируем программу искр
  gl.useProgram(programFirework);

  gl.bindBuffer(gl.ARRAY_BUFFER, sparkPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionAttributeLocationFirework);
  gl.vertexAttribPointer(
    positionAttributeLocationFirework,
    3,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.uniformMatrix4fv(pMatrixUniformLocationFirework, false, pMatrix);
  gl.uniformMatrix4fv(mvMatrixUniformLocationFirework, false, mvMatrix);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(textureLocationFirework, 0);

  gl.drawArrays(gl.POINTS, 0, positions.length / 3);
}
