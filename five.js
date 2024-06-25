// Определяем класс искры
function Spark() {
  // Инициализируем искру
  this.init();
}

// Количество искр
Spark.sparksCount = 300;

// Методы класса Spark
Spark.prototype = {
  // Метод инициализации искры
  init: function () {
    // Время создания искры
    this.timeFromCreation = performance.now();

    // Задаем случайное направление полета искры в градусах (от 0 до 360)
    this.angle = Math.random() * 360;

    // Радиус - это расстояние, которое пролетит искра
    this.radius = Math.random();

    // Вычисляем максимальные координаты искры на окружности
    this.xMax = Math.cos(this.angle) * this.radius;
    this.yMax = Math.sin(this.angle) * this.radius;

    // Вычисляем скорость искры (dx и dy) в зависимости от множителя
    var multiplier = 12500 + Math.random() * 1250;
    this.dx = this.xMax / multiplier;
    this.dy = this.yMax / multiplier;

    // Для того, чтобы не все искры начинали движение из начала координат,
    // задаем каждой искре свое начальное положение
    this.x = (this.dx * 1000) % this.xMax;
    this.y = (this.dy * 2000) % this.yMax;
  },

  // Метод для перемещения искры
  move: function (time) {
    // Находим разницу между вызовами отрисовки, чтобы анимация работала
    // одинаково на компьютерах разной мощности
    var timeShift = time - this.timeFromCreation;
    this.timeFromCreation = time;

    // Вычисляем скорость искры
    var speed = timeShift;

    // Обновляем координаты искры
    this.x += this.dx * speed;
    this.y += this.dy * speed;

    // Если искра достигла конечной точки, перезапускаем ее
    if (
      Math.abs(this.x) > -4 ||
      Math.abs(this.y) > 4 //Math.abs(this.yMax)
    ) {
      this.x = Math.random() * -10 + 5;
      this.y = Math.random() * -8 + 4;
    }
  },
};

// Инициализация WebGL
var canvas = document.getElementById("glCanvasFive");
var gl = canvas.getContext("webgl");
if (!gl) {
  console.error("Unable to initialize WebGL. Your browser may not support it.");
}

// Инициализация программы искр
var programSpark = webglUtils.createProgramFromScripts(gl, [
  "vertex-shader-spark",
  "fragment-shader-spark",
]);
var positionAttributeLocationSpark = gl.getAttribLocation(
  programSpark,
  "a_position"
);
var textureLocationSpark = gl.getUniformLocation(programSpark, "u_texture");
var pMatrixUniformLocationSpark = gl.getUniformLocation(
  programSpark,
  "u_pMatrix"
);
var mvMatrixUniformLocationSpark = gl.getUniformLocation(
  programSpark,
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
image.src = "water.png";
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

let mouseDown = false;
let mouseUp = true;
let lastTime = performance.now();
let xCord;
let yCord;

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
for (var i = 0; i < Spark.sparksCount; i++) {
  sparks.push(new Spark());
}

function drawScene(time) {
  // Очищаем канвас
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Устанавливаем матрицы проекции и вида
  var pMatrix = mat4.create();
  var mvMatrix = mat4.create();
  mat4.perspective(pMatrix, 45, canvas.width / canvas.height, 0.1, 100.0);
  mat4.translate(mvMatrix, mvMatrix, [0, -1.0, -6.0]);

  //Вызываем смещение искр при каждой отрисовке
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
  drawFire(positions, pMatrix, mvMatrix);

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
    positionsFromCenter.push(xCord, yCord, 0);
    positionsFromCenter.push(positions[i], positions[i + 1], positions[i + 2]);
    colors.push(1, 1, 1);
    colors.push(0.47, 0.31, 0.24);
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

function drawFire(positions, pMatrix, mvMatrix) {
  // Активируем программу искр
  gl.useProgram(programSpark);

  gl.bindBuffer(gl.ARRAY_BUFFER, sparkPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionAttributeLocationSpark);
  gl.vertexAttribPointer(
    positionAttributeLocationSpark,
    3,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.uniformMatrix4fv(pMatrixUniformLocationSpark, false, pMatrix);
  gl.uniformMatrix4fv(mvMatrixUniformLocationSpark, false, mvMatrix);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(textureLocationSpark, 0);

  gl.drawArrays(gl.POINTS, 0, positions.length / 3);
}
