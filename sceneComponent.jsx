import { Meteor } from 'meteor/meteor';
import {
  Engine,
  Scene,
  Vector3,
  ArcRotateCamera,
  CubeTexture,
  MeshBuilder,
  StandardMaterial,
  Texture,
  Color3,
  PointLight,
  ShaderMaterial,
  VolumetricLightScatteringPostProcess,
  Mesh,
  Tools,
  VertexData,
  Matrix,
  TransformNode,
  Effect,
  GlowLayer,
} from "@babylonjs/core";
import {
  AdvancedDynamicTexture,
  Control,
  TextBlock,
  StackPanel,
  Rectangle,
  Line,
} from "@babylonjs/gui";
import { FireProceduralTexture } from "@babylonjs/procedural-textures/fire";
import React, { useEffect, useRef, useState } from "react";
import { useToast, Text } from '@chakra-ui/react';
import Ephemeris from 'ephemeris';
import Spinner from './spinner.jsx';

export function SceneComponent() {
  // const constNT = 1344643200000;
  // const constD = 86459178.082191780821918;
  // const constY = 31557600000;
  const curentD = new Date();
  // const minD = new Date(1439164800000);
  // const maxD = new Date(4090003200000);
  const [CNT, setCNT] = useState('00.00.00');// ctNT
  const [NTY, setNTY] = useState(0);// cNTY
  const [NTD, setNTD] = useState(0);// cNTD
  const [NTDp, setNTDp] = useState(0);// cNTDp
  const [curD, setCurD] = useState(curentD);
  const [loaded, setLoaded] = useState(false);
  const [scene, setScene] = useState(null);
  const [engine, setEngine] = useState(null);
  const [advancedTexture, setAdvancedTexture] = useState(null);
  const [tbNT, setTbNT] = useState(null);
  const [tbDA, setTbDA] = useState(null);
  const [tbMA, setTbMA] = useState(null);
  const [tbMP, setTbMP] = useState(null);
  const [tbTD, setTbTD] = useState(null);
  const [uiPanel, setUiPanel] = useState(null);
  const [btnMenu, setBtnMenu] = useState(null);
  const [buiPanel, setBuiPanel] = useState(null);
  const [menuItem2, setMenuItem2] = useState(null);
  const [menuContainer, setMenuContainer] = useState(null);
  const [dirPA, setDirPA] = useState(false);
  const [dirMA, setDirMA] = useState(false);
  const [dirMD, setDirMD] = useState(0);
  const [phaM, setPhaM] = useState(0);
  const [dayM, setDayM] = useState(0);
  const [tDate, setTDate] = useState('');
  const [tDateS, setTDateS] = useState(0);
  const [isDDD, setIsDDD] = useState(false);
  const [start, setStart] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const reactCanvas = useRef(null);


  useEffect(() => {
    if (!reactCanvas.current) { return; }
    setStart(true);
  }, [reactCanvas]);

  // Функция для бинарного поиска ближайшего меньшего элемента по полю u, который не равен targetU
  function findClosestSmaller(arr, targetU) {
    let left = 0;
    let right = arr.length - 1;
    let closestSmaller = null;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (arr[mid].u <= targetU) {
        // if (arr[mid].u !== targetU) {
          closestSmaller = arr[mid];
        // }
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return closestSmaller;
  }

  const handleDateChange = (value) => {
    if (value instanceof Date) {
      const val = new Date(value);
      val.setHours(24-(val.getTimezoneOffset() / 60 + 4));
      val.setMinutes(0);
      val.setSeconds(0);
      val.setMilliseconds(0);
      if (!this.NT || this.NT.length < 30000) {
        this.NT = [];
        const udy = { u: 1344643200000, d: 0, y: 0 };
        while (udy.u < 4090089600000) {
          this.NT.push({ ...udy });
          if (udy.y === 11 && udy.d === 121) {
            udy.u += 43229589.41095890410959;
            udy.d += 1;
            this.NT.push({ ...udy });
            udy.u += 43229589.41095890410959;
            udy.d += 1;
            this.NT.push({ ...udy });
          } else {
            udy.u += 86459178.082191780821918;
            udy.d += 1;
          }
          if (udy.d === 365) {
            udy.d = 0;
            udy.y += 1;
          }
        }
      }
      const res = findClosestSmaller(this.NT, val.getTime());
      const yNTr = Math.trunc(res.y);
      const dNTrr = Math.trunc(res.d);
      const dpNTr = Math.trunc(dNTrr / 10);
      const dNTr = dNTrr-(dpNTr*10);
      const yNT = `00${  yNTr.toString()}`;
      const dNT = `00${  dNTr.toString()}`;
      const dpNT = `00${  dpNTr.toString()}`;
      const tNT = `${dNT.substring(dNT.length - 2)  }.${  dpNT.substring(dpNT.length - 2)  }.${  yNT.substring(yNT.length - 2)}`;
      setNTY(yNTr);
      setNTD(dNTr);
      setNTDp(dpNTr);
      setCNT(tNT);
      setCurD(value);
    }
  };

  // здесь будут основные конфиги
  const config = {
    PLANET_RADIUS: 50, // радиус земли
    PLANET_V: 300, // количество вершин
    MOON_RADIUS: 20, // радиус луны
    ENV_H: 2, // высота атмосферы
    SUN_RADIUS: 40,// радиус Солнца
    DUST: 1000,// количество частиц
  };

  // function loadAssets(scene) {
  //   let assetsManager = new AssetsManager(scene);
  //   let StarData = assetsManager.addTextFileTask("starData", 'textures/starsData.json');
  //   let starData = null;
  //   StarData.onSuccess = (task) => {
  //     starData = JSON.parse(task.text);
  //     createSky(scene, starData);
  //   }
  //   assetsManager.load();
  // }

  function llToXYZ(latitude = 55.7558, longitude = 37.6173, r = 25) {
    // Переводим градусы в радианы
    const phi = (90 - latitude) * (Math.PI / 180);
    const theta = (longitude + 180) * (Math.PI / 180);
    const x = (r * Math.sin(phi) * Math.cos(theta));
    const z = (r * Math.sin(phi) * Math.sin(theta));
    const y = (r * Math.cos(phi));
    return new Vector3(x, y, z);
  }

  // function llToXYZ(latitude = 55.7558, longitude = 37.6173, r = 25) {
  //   // Угол наклона земной оси в радианах
  //   const tilt = Tools.ToRadians(latitude);
  
  //   // Переводим градусы в радианы
  //   const phi = Tools.ToRadians(90 - latitude);
  //   const theta = Tools.ToRadians(longitude + 180);
  
  //   // Вычисляем координаты без учета наклона
  //   const x1 = r * Math.sin(phi) * Math.cos(theta);
  //   const z1 = r * Math.sin(phi) * Math.sin(theta);
  //   const y1 = r * Math.cos(phi);
  
  //   // Создаем вектор позиции
  //   let position = new Vector3(x1, y1, z1);
  
  //   // Матрица поворота для наклона оси Земли
  //   const rotationMatrix = Matrix.RotationX(tilt);
  
  //   // Применяем матрицу поворота к координатам точки
  //   position = Vector3.TransformCoordinates(position, rotationMatrix);
  
  //   return position;
  // }
  
  // Функция для вычисления положения Земли на орбите с использованием вычисленных данных
  function calculateEarthPosition(earthData, date) {
    const {
      longitude,
      distance,
      epoch,
    } = earthData;
    const perihelionRad = (102.9373+(0.000047082558678*(epoch-2451545))) * (Math.PI / 180);
    const trueAnomaly = longitude - perihelionRad;
    // if (trueAnomaly < 0) {
    //     trueAnomaly += 2 * Math.PI;
    // }
    const distanceKm = distance * 149597870.7;
    const x = -(distanceKm * Math.cos(trueAnomaly));
    const z = -(distanceKm * Math.sin(trueAnomaly));
    const y = 0;
    let clEv = null;
    if (this.perigeePoint && this.apogeePoint) {
      if ((date >= this.perigeePoint.d) && (this.apogeePoint.d < this.perigeePoint.d)) {
        clEv = this.perigeePoint;
      } else {
        clEv = this.apogeePoint;
      }
    }
    const direction = (clEv === this.perigeePoint);
    return { position: { x, y, z }, direction, trueAnomaly, longitude};
  }

  function normalizeCoordinates(points,d=700,aP='apogeePoint',pP='perigeePoint',minD='minDistance',maxD='maxDistance') {
    this[aP] = null;
    this[pP] = null;
    this[minD] = Number.MAX_VALUE;
    this[maxD] = 0;
    points.forEach(point => {
      const {p} = point;
      const distance = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
      if (distance > this[maxD]) {
        this[maxD] = distance;
        this[aP] = { p: new Vector3(p.x, p.y, p.z), d: point.d };
      }
      if (distance < this[minD]) {
        this[minD] = distance;
        this[pP] = { p: new Vector3(p.x, p.y, p.z), d: point.d };
      }
    });
    // Нормализуем координаты
    // const normalizedPoints = points.map(point => {
    //   const p = point.p;
    //   const normalizedX = (p.x / this[maxD]) * d;
    //   const normalizedY = (p.y / this[maxD]) * d;
    //   const normalizedZ = (p.z / this[maxD]) * d;
    //   // console.log(d);
    //   // console.log({ normalizedX, normalizedY, normalizedZ });
    // return new Vector3(normalizedX, normalizedY, normalizedZ);
    // });
    // return normalizedPoints;
  }

  function drawEarthOrbit(date) {// scene, 
    // let mMm = scene.getMeshByName("earthOrbit");
    // if (mMm) {
    //   mMm.dispose();
    // }
    const points = [];
    const fpz = { p: calculateEarthPosition(Ephemeris.getPlanet('earth', date, 0, 0, 0).observed.earth.raw, date).position, d: date };
    const year = date.getFullYear();
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const daysInYear = isLeapYear ? 366 : 365;
    const perDay = 86400000 * daysInYear / 1000;
    points.push(fpz);
    date = new Date(date.getTime() - perDay);
    for (let day = 1; day < 1000; day++) {
      points.push({ p: calculateEarthPosition(Ephemeris.getPlanet('earth', date, 0, 0, 0).observed.earth.raw, date).position, d: date });
      date = new Date(date.getTime() - perDay);
    }
    points.push(fpz);
    normalizeCoordinates(points);
    // const orbit = MeshBuilder.CreateLines("earthOrbit", { points: normalizeCoordinates(points) }, scene);
    // orbit.color = new Color3(1, 1, 0); // Жёлтый цвет орбиты
    // Добавляем маркеры для апогея и перигея
    // mMm = scene.getMeshByName("apogeeMarker");
    // if (mMm) {
    //   mMm.dispose();
    // }
    // mMm = scene.getMeshByName("perigeeMarker");
    // if (mMm) {
    //   mMm.dispose();
    // }
    // const apogeeMarker = MeshBuilder.CreateSphere("apogeeMarker", { diameter: 5 }, scene);
    // apogeeMarker.position.x = (this.apogeePoint.p.x / this.maxDistance) * 700;
    // apogeeMarker.position.y = (this.apogeePoint.p.y / this.maxDistance) * 700;
    // apogeeMarker.position.z = (this.apogeePoint.z / this.maxDistance) * 700;
    // apogeeMarker.material = new StandardMaterial("apogeeMat", scene);
    // apogeeMarker.material.diffuseColor = new Color3(0, 1, 0); // Зелёный цвет
    // const perigeeMarker = MeshBuilder.CreateSphere("perigeeMarker", { diameter: 5 }, scene);
    // perigeeMarker.position.x = (this.perigeePoint.p.x / this.maxDistance) * 700;
    // perigeeMarker.position.y = (this.perigeePoint.p.y / this.maxDistance) * 700;
    // perigeeMarker.position.z = (this.perigeePoint.p.z / this.maxDistance) * 700;
    // perigeeMarker.material = new StandardMaterial("perigeeMat", scene);
    // perigeeMarker.material.diffuseColor = new Color3(1, 0, 0); // Красный цвет
    // return orbit;
  }
  
  function drawMoonOrbit(date) {// scene, , eM 
    // let mMm = scene.getMeshByName("moonOrbit");
    // if (mMm) {
    //   mMm.dispose();
    // }
    const points = [];
    const fpz = { p: convertLunarCoordinates(Ephemeris.getPlanet('moon', date, 0, 0, 0).observed.moon.raw.position, date).position, d: date };
    const perDay = 86400000 * 0.27321661;
    points.push(fpz);
    date = new Date(date.getTime() - perDay);
    for (let day = 1; day < 100; day++) {
      points.push({ p: convertLunarCoordinates(Ephemeris.getPlanet('moon', date, 0, 0, 0).observed.moon.raw.position, date).position, d: date });
      date = new Date(date.getTime() - perDay);
    }
    points.push(fpz);
    normalizeCoordinates(points,200,'apogeePointM','perigeePointM','minDistanceM','maxDistanceM');
    // const orbit = MeshBuilder.CreateLines("moonOrbit", { points: normalizeCoordinates(points,200,'apogeePointM','perigeePointM','minDistanceM','maxDistanceM') }, scene);
    // orbit.color = new Color3(1, 1, 0); // Жёлтый цвет орбиты
    // orbit.parent = eM;
    // Добавляем маркеры для апогея и перигея
    // mMm = scene.getMeshByName("apogeeMarkerM");
    // if (mMm) {
    //   mMm.dispose();
    // }
    // mMm = scene.getMeshByName("perigeeMarkerM");
    // if (mMm) {
    //   mMm.dispose();
    // }
    // const apogeeMarker = MeshBuilder.CreateSphere("apogeeMarkerM", { diameter: 3 }, scene);
    // apogeeMarker.position.x = (this.apogeePointM.p.x / this.maxDistanceM) * 200;
    // apogeeMarker.position.y = (this.apogeePointM.p.y / this.maxDistanceM) * 200;
    // apogeeMarker.position.z = (this.apogeePointM.p.z / this.maxDistanceM) * 200;
    // apogeeMarker.material = new StandardMaterial("apogeeMatM", scene);
    // apogeeMarker.material.diffuseColor = new Color3(0, 1, 0); // Зелёный цвет
    // apogeeMarker.parent = eM;
    // const perigeeMarker = MeshBuilder.CreateSphere("perigeeMarkerM", { diameter: 3 }, scene);
    // perigeeMarker.position.x = (this.perigeePointM.p.x / this.maxDistanceM) * 200;
    // perigeeMarker.position.y = (this.perigeePointM.p.y / this.maxDistanceM) * 200;
    // perigeeMarker.position.z = (this.perigeePointM.p.z / this.maxDistanceM) * 200;
    // perigeeMarker.material = new StandardMaterial("perigeeMatM", scene);
    // perigeeMarker.material.diffuseColor = new Color3(1, 0, 0); // Красный цвет
    // perigeeMarker.parent = eM;
    // return orbit;
  }

  function createSky(scene, starData) {
    const starMesh = new Mesh('starMesh', scene);
    starMesh.alphaIndex = 20;
    const starsCoordinates = [];
    const starsIndices = [];
    const starsColor = [];
    const starsUV = [];
    let L = 0;
    for (let astLimitLoop = starData.rightAscension.length, i = 0; i < astLimitLoop; i++) {
      for (let starLimitLoop = starData.rightAscension[i].length, j = 0; j < starLimitLoop; j++) {
        const ra = (starData.rightAscension[i][j][0] + starData.rightAscension[i][j][1]/60 + starData.rightAscension[i][j][2]/3600) * 15;
        const decDegrees = starData.declination[i][j][0];
        const decMinutes = starData.declination[i][j][1];
        const decSeconds = starData.declination[i][j][2];
        const dec = (decDegrees < 0 || Object.is(decDegrees, -0))
                  ? -(Math.abs(decDegrees) + decMinutes/60 + decSeconds/3600)
                  : decDegrees + decMinutes/60 + decSeconds/3600;
        const rightAscension = Tools.ToRadians(ra);
        const declination = Tools.ToRadians(dec);
        const scaleFactor = (10.8 - (starData.apparentMagnitude[i][j]*1.5)) * this.starScale;
        let _ = new Vector3(0 * scaleFactor, .7 * scaleFactor, this.radius);
        let C = new Vector3(-.5 * scaleFactor, -.3 * scaleFactor, this.radius);
        let f = new Vector3(.5 * scaleFactor, -.3 * scaleFactor, this.radius);
        const coorTransformer = Matrix.RotationYawPitchRoll(-rightAscension, -declination, 0);
        _ = Vector3.TransformCoordinates(_, coorTransformer);
        C = Vector3.TransformCoordinates(C, coorTransformer);
        f = Vector3.TransformCoordinates(f, coorTransformer);
        starsCoordinates.push(_.x, _.y, _.z, C.x, C.y, C.z, f.x, f.y, f.z);
        const starColor = starData.color[i][j];
        starsColor.push(starColor[0], starColor[1], starColor[2], starColor[3], starColor[0], starColor[1], starColor[2], starColor[3], starColor[0], starColor[1], starColor[2], starColor[3]);
        starsUV.push(.5, 1, 0, 0, 1, 0);
        starsIndices.push(L, L + 1, L + 2);
        L += 3;
      }
    }
    const vertexData = new VertexData;
    vertexData.positions = starsCoordinates;
    vertexData.indices = starsIndices;
    vertexData.colors = starsColor;
    vertexData.uvs = starsUV;
    vertexData.applyToMesh(starMesh);
    const starMaterial = new StandardMaterial('starMaterial', scene);
    const starTexture = new Texture('textures/star.png', scene);
    starMaterial.opacityTexture = starTexture;
    starMaterial.disableLighting = true;
    starMaterial.emissiveColor = new Color3(1, 1, 1);
    starMesh.material = starMaterial;
    const linesMaterial = new StandardMaterial("linesMaterial", scene);
    linesMaterial.emissiveColor = this.asterismColor;
    linesMaterial.disableLighting = true;
    function createLine(start, end) {
      const points = [start, end];
      const lines = MeshBuilder.CreateLines("lines", { points }, scene);
      lines.color = this.asterismColor;
      return lines;
    }
    for (let asr = 0; asr < starData.asterismIndices.length; asr++) {
      for (let i = 0; i < starData.asterismIndices[asr].length; i++) {
        for (let j = 0; j < starData.asterismIndices[asr][i].length - 1; j++) {
          const startIdx = starData.asterismIndices[asr][i][j];
          const endIdx = starData.asterismIndices[asr][i][j + 1];
          const start = new Vector3(
              starsCoordinates[startIdx * 3*3],
              starsCoordinates[startIdx * 3*3 + 1],
              starsCoordinates[startIdx * 3*3 + 2]
          );
          const end = new Vector3(
              starsCoordinates[endIdx * 3*3],
              starsCoordinates[endIdx * 3*3 + 1],
              starsCoordinates[endIdx * 3*3 + 2]
          );
          createLine(start, end);
        }
      }
    }
  }

  function convertLunarCoordinates(lunarData, date) {
    const distanceInKm = lunarData.geometric.distance * 149597870.7;
    const latitudeInRadians = lunarData.geometric.latitude * (Math.PI / 180);
    const longitudeInRadians = (lunarData.geometric.longitude+66) * (Math.PI / 180);
    const x = distanceInKm * Math.cos(latitudeInRadians) * Math.cos(longitudeInRadians);
    const z = distanceInKm * Math.cos(latitudeInRadians) * Math.sin(longitudeInRadians);
    const y = distanceInKm * Math.sin(latitudeInRadians);
    let clEv = null;
    let days = 0;
    if (this.perigeePointM && this.apogeePointM) {
      if ((date >= this.perigeePointM.d) && (this.apogeePointM.d < this.perigeePointM.d)) {
        clEv = this.perigeePointM;
      } else {
        clEv = this.apogeePointM;
      }
      days = Math.floor((date - clEv.d) / 86400000);
      days = (days < 0 || days > 19) ? 0 : days;
      // console.log((date - clEv.d) / 86400000);
      // console.log('!!!!!!');
      // console.log(clEv.d);
      // console.log(this.perigeePointM.d);
      // console.log(this.apogeePointM.d);
      // console.log(date);
    }
    const incSE = (lunarData.sunElongation === this.prevSE) ? this.prevIncSE : ((lunarData.sunElongation < this.prevSE) && ((this.prevSE - lunarData.sunElongation) < 100));
    this.prevIncSE = incSE;
    this.prevSE = lunarData.sunElongation;
    const sE = ((incSE ? (360 - lunarData.sunElongation) : lunarData.sunElongation) + 0.6) % 360;
    const dayM = Math.ceil((sE / 360) * 29.530588 * 1000) / 1000;
    let phase;
    if ((sE >= 0 && sE < 10) || sE > 350) {
      phase = 0;// "Новолуние";
    } else if (sE >= 10 && sE <= 85) {
      phase = 1;// "Растущий серп";
    } else if (sE > 85 && sE < 95) {
      phase = 2;// "Первая четверть";
    } else if (sE >= 95 && sE <= 170) {
      phase = 3;// "Растущая Луна";
    } else if (sE > 170 && sE < 190) {
      phase = 4;// "Полнолуние";
    } else if (sE >= 190 && sE <= 265) {
      phase = 5;// "Убывающая Луна";
    } else if (sE > 265 && sE < 275) {
      phase = 6;// "Последняя четверть";
    } else if (sE >= 275 && sE <= 350) {
      phase = 7;// "Убывающий серп";
    }
    return {
      position: { x, y, z },
      phase,
      dayM,
      direction: clEv === this.perigeePointM,
      days,
    };
  }

  function calculateLL(localTime, utcTime) {
    const latitude = 0;
    let longitude = 0;
    // if ("geolocation" in navigator) {
    //   navigator.geolocation.getCurrentPosition((position) => {
    //     latitude = position.coords.latitude;
    //     longitude = position.coords.longitude;
    //   });
    // } else {
      const timeDifferenceMilliseconds = localTime - utcTime;
      const timeDifferenceHours = timeDifferenceMilliseconds / 3600000;
      longitude = timeDifferenceHours * 15;
    // }
    return { latitude, longitude };
  }

  function calculateJulianDate(date) {
    let year = date.getFullYear();
    let month = date.getMonth() + 1; // Январь = 0, поэтому прибавляем 1
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    const millisecond = date.getMilliseconds();
    if (month <= 2) {
      year -= 1;
      month += 12;
    }
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);
    const dayFraction = (hour + (minute + (second + millisecond / 1000) / 60) / 60) / 24;
    const JD = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + dayFraction + B - 1524.5;
    return JD;
  }
      
  function calculateGST(julianDate) {
    const T = (julianDate - 2451545.0) / 36525.0;
    let GST = 280.46061837 + 360.98564736629 * (julianDate - 2451545.0) + 0.000387933 * T ** 2 - T ** 3 / 38710000;
    GST = GST % 360;
    if (GST < 0) {
      GST += 360;
    }
    return GST; // В градусах
  }
      
  function calculateZenithPosition(dataSun, date) {
    const julianDate = calculateJulianDate(date); // Использует UTC
    const GST = calculateGST(julianDate); // Передаем julianDate
    const RA_hours = dataSun.ra.hours + dataSun.ra.minutes / 60 + dataSun.ra.seconds / 3600;
    const RA_deg = RA_hours * 15; // 15 градусов на каждый час
    let longitude = (GST - (RA_deg-91) + 360) % 360;
    const latitude = dataSun.dec.degree + dataSun.dec.minutes / 60 + dataSun.dec.seconds / 3600;
    return {
      longitude,
      latitude,
    };
  }
            
  const onSceneReady = (scene, engine) => {
    // scene.ambientColor = new Color3(1, 1, 1);
    Effect.ShadersStore.shPlanetVertexShader = `
        precision highp float;

        // Attributes
        attribute vec3 position;
        attribute vec3 normal;
        attribute vec2 uv;

        // Uniforms
        uniform mat4 world;
        uniform mat4 worldViewProjection;

        // Varying
        varying vec2 vUV;
        varying vec3 vPositionW;
        varying vec3 vNormalW;

        void main(void) {
            vec4 outPosition = worldViewProjection * vec4(position, 1.0);
            gl_Position = outPosition;

            vPositionW = vec3(world * vec4(position, 1.0));
            vNormalW = normalize(vec3(world * vec4(normal, 0.0)));

            vUV = uv;
        }
    `;
    Effect.ShadersStore.shPlanetFragmentShader = `
        precision highp float;

        // Varying
        varying vec2 vUV;
        varying vec3 vPositionW;
        varying vec3 vNormalW;

        // Refs
        uniform vec3 lightPosition;
        uniform sampler2D diffuseTexture;
        uniform sampler2D nightTexture;


        void main(void) {
            vec3 direction = lightPosition - vPositionW;
            vec3 lightVectorW = normalize(direction);


            // diffuse
            float lightDiffuse = max(0.1, dot(vNormalW, lightVectorW));

            vec3 color;
            vec4 nightColor = texture2D(nightTexture, vUV).rgba;
            vec3 diffuseColor = texture2D(diffuseTexture, vUV).rgb;

            color = diffuseColor * lightDiffuse + (nightColor.rgb * nightColor.a * pow((1.0 - lightDiffuse), 6.0));
            gl_FragColor = vec4(color, 1.0);
        }
    `;
    Effect.ShadersStore.shCloudsVertexShader = `
        precision highp float;

        // Attributes
        attribute vec3 position;
        attribute vec3 normal;
        attribute vec2 uv;

        // Uniforms
        uniform mat4 world;
        uniform mat4 worldViewProjection;

        // Varying
        varying vec2 vUV;
        varying vec3 vPositionW;
        varying vec3 vNormalW;

        void main(void) {
            vec4 outPosition = worldViewProjection * vec4(position, 1.0);
            gl_Position = outPosition;

            vPositionW = vec3(world * vec4(position, 1.0));
            vNormalW = normalize(vec3(world * vec4(normal, 0.0)));

            vUV = uv;
        }
    `;
    Effect.ShadersStore.shCloudsFragmentShader = `
        precision highp float;

        varying vec3 vPositionW;
        varying vec3 vNormalW;

        varying vec2 vUV;

        uniform sampler2D cloudsTexture;
        uniform vec3 cameraPosition;
        uniform vec3 lightPosition;


        float computeFresnelTerm(vec3 viewDirection, vec3 normalW, float bias, float power)
        {
            float fresnelTerm = pow(bias + dot(viewDirection, normalW), power);
            return clamp(fresnelTerm, 0., 1.);
        }


        void main(void) {
            vec3 viewDirectionW = normalize(cameraPosition - vPositionW); //Нормализованный вектор взгляда от камеры до вершины

            // Light
            vec3 direction = lightPosition - vPositionW; //Направление от источника света до вершины
            vec3 lightVectorW = normalize(direction); //Получение нормализованного вектора

            // lighting
            float lightCos = dot(vNormalW, lightVectorW); //Получаем косинус между направлением нормали вершины и направлением "луча света" вершину
            float lightDiffuse = max(0., lightCos); //рассчитываем коэффициент освещенности от 0 до 1

            vec3 color = texture2D(cloudsTexture, vUV).rgb; //получаем RGB составляющую цвета текселя по переданной UV координате из текстуры
            float globalAlpha = clamp(color.r, 0.0, 1.0); //определяем альфа составляющую

            // Fresnel
            float fresnelTerm = computeFresnelTerm(viewDirectionW, vNormalW, 0.72, 5.0);

            float resultAlpha; //результирующая альфа составляющая


            if (fresnelTerm < 0.95) {
                //это краевая, подсвечиваемая зона сферы
                float envDiffuse = clamp(pow(fresnelTerm - 0.92, 1.0/2.0) * 2.0, 0.0, 1.0); //коэффициент рассеивания для смягчения границы перехода между центральной части и частию сияния
                resultAlpha = fresnelTerm * envDiffuse * lightCos; //получаем прозрачность умножая коэффициент Френеля на косинус мешду светом и взглядом на вершину
                color = color / 2.0 + vec3(0.0,0.5,0.7) ; //уменьшаем базовый текстурный цвет в 2 раза и прибавляем голубой
            } else {
                //это центр сферы, должен демонстрировать
                resultAlpha = fresnelTerm * globalAlpha * lightDiffuse;
            }

            //эффект заката
            float backLightCos = dot(viewDirectionW, lightVectorW); //косинус между вектором взгляда на вершину и вектором луча света
            float cosConst = 0.9; // граница расчета эффекта заката. 0.9 => угол в ~(155 - 205) градусов

            //если угол между вектором взгляда и лучом света  ~(155 - 205) градусов
            if (backLightCos < -cosConst) {
            //Обработка свечения с обратной стороны
            float sunHighlight = pow(backLightCos+cosConst, 2.0); //коэффициент подсветки
            if (fresnelTerm < 0.9) {
                //если это край атмосферы (подсвечиваемая часть) то для нее такой рассчет
                sunHighlight *= 65.0; //увеличиваем коэффициент подсветки заката
                float envDiffuse = clamp(pow(fresnelTerm - 0.92, 1.0/2.0) * 2.0, 0.0, 1.0);
                resultAlpha = sunHighlight; //устанавливаем его как прозрачность
                color *= lightDiffuse; //умножаем основной цвет на коэффициент освещенности
                color.r += sunHighlight; //увеличиваем красную составляющую на коэффициант подсветки заката
                color.g += sunHighlight / 2.0; //увеливаем зеленую составляющую на тот же коэффициент но в 2 раза меньше (чтобы был оранжевый цвет)
                gl_FragColor = vec4(color, resultAlpha);
                return;
            } else {
                //свечение центральной части сферы
                sunHighlight *= 95.0; //увеличиваем коэффициент подсветки заката
                sunHighlight *= 1.0 + lightCos; //уменьшить (lightCos < 0.0) свечение при приближении к центр сферы (ограничиваем свечение краями, иначе - подсветим то что не может быть подсвечено)
                color = vec3(sunHighlight,sunHighlight / 2.0,0.0);
                resultAlpha = sunHighlight; //устанавливаем его как прозрачность
                gl_FragColor = vec4(color, resultAlpha);
                return;
            }
            }

            gl_FragColor = vec4(color * lightDiffuse, resultAlpha);
        }
    `;
    // loadAssets(scene);
    const starData = {rightAscension:[[[2,31,48.7],[17,32,12.9],[16,45,58.1],[15,44,3.5],[16,17,30.3],[15,20,43.7],[14,50,42.3]],
      [[6,3,55.2],[6,11,56.4],[6,7,34.3],[5,54,22.9],[6,2,23.0],[5,55,10.3],[5,35,8.3],[5,25,7.9],[5,32,0.4],[5,14,32.3],[5,47,45.4],[5,40,45.5],[4,54,53.8],[4,50,36.7],[4,49,50.4],[4,51,12.4],[4,54,15.1],[4,58,32.9],[5,36,12.8],[5,35,26.0],[5,35,24.0],[5,35,23.2],[5,35,12.0]],
      [[6,45,8.92]],
      [[7,39,18.1]],
      [[7,45,18.9]],
      [[5,16,41.4]],
      [[4,35,55.2]]],
      declination:[[[89,15,51.0],[86,35,11.0],[82,2,14.0],[77,47,40.0],[75,45,19.0],[71,50,2.0],[74,9,20.0]],
      [[20,8,18.0],[14,12,32.0],[14,46,6.0],[20,16,34.0],[9,38,51.0],[7,24,25.0],[9,56,3.0],[6,20,59.0],[-0,17,57.0],[-8,12,6.0],[-9,40,11.0],[-1,56,34.0],[10,9,3.0],[8,54,1.0],[6,57,41.0],[5,36,18.0],[2,26,26.0],[1,42,51.0],[-1,12,7.0],[-5,54,36.0],[-5,27,0.0],[-4,50,18.0],[-4,24,0.0]],
      [[-16,42,58.02]],
      [[5,13,30.0]],
      [[28,1,34.0]],
      [[45,59,53.0]],
      [[16,30,33.0]]],
      apparentMagnitude:[[2.02,4.36,4.23,4.32,4.95,3.05,2.08],
      [4.63,4.48,4.42,4.41,4.12,0.5,3.54,1.64,2.23,0.12,2.06,2.05,4.65,4.36,3.19,3.69,3.72,4.47,1.7,2.77,2.9,4.59,4.6],
      [-3.46],
      [0.38],
      [1.14],
      [0.08],
      [0.85]],
      color:[[[1.0, 1.0, 0.8, 1.0],[1.0, 1.0, 1.0, 1.0],[0.0, 0.5, 1.0, 1.0],[1.0, 0.9, 0.6, 1.0],[1.0, 0.9, 0.6, 1.0],[0.9, 0.9, 1.0, 1.0],[1.0, 0.5, 0.0, 1.0]],
      [[1.0, 0.5, 0.5, 1.0],[0.7, 0.7, 1.0, 1.0],[0.6, 0.6, 1.0, 1.0],[1.0, 0.5, 0.2, 1.0],[0.3, 0.3, 1.0, 1.0],[1.0, 0.4, 0.0, 1.0],[0.1, 0.2, 1.0, 1.0],[0.2, 0.2, 1.0, 1.0],[0.15, 0.25, 1.0, 1.0],[0.1, 0.2, 1.0, 1.0],[0.2, 0.3, 1.0, 1.0],[0.0, 0.5, 1.0, 1.0],[1.0, 1.0, 0.98, 1.0],[1.0, 1.0, 0.9, 1.0],[1.0, 0.8, 0.4, 1.0],[0.7, 0.7, 1.0, 1.0],[0.7, 0.7, 1.0, 1.0],[1.0, 0.5, 0.0, 1.0],[0.5, 0.5, 1.0, 1.0],[0.7, 0.7, 1.0, 1.0],[1.0, 0.2, 0.2, 1.0],[0.6, 0.8, 1.0, 1.0],[0.5, 0.7, 1.0, 1.0]],
      [[0.8, 0.8, 1.0, 1.0]],
      [[1.0, 0.9, 0.7, 1.0]],
      [[1.0, 0.65, 0.13, 1.0]],
      [[1.0, 1.0, 0.5, 1.0]],
      [[1.0, 0.0, 0.0, 1.0]]],
      asterismIndices:[[[0,1,2,3,4,5,6,3]],
      [[7,8,9,10],[8,11,12,13,14,15,16,17,18,12],[12,14,21],[19,20,21,22,23,24]]]};
    createSky(scene, starData);
    const date = new Date();
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const utcTime = new Date(date.getTime() + timezoneOffset);
    // console.log(Date.now());
    // console.log(Ephemeris.getPlanet('moon', date, 0, 0, 0));
    // console.log(Ephemeris.getPlanet('earth', date, 0, 0, 0));
    // console.log(Ephemeris.getPlanet('sun', new Date(2024, 6, 25, 0, 0, 0, 0), 0, 0, 0).observed.sun.raw.position.apparent);
    // console.log(calculateZenithPosition(Ephemeris.getPlanet('sun', new Date(2024, 6, 25, 0, 0, 0, 0), 0, 0, 0).observed.sun.raw.position.apparent,new Date(2024, 6, 25, 0, 0, 0, 0)));
    // console.log(Date.now());
    drawEarthOrbit(date);// scene, 
    const pd = calculateEarthPosition(Ephemeris.getPlanet('earth', utcTime, 0, 0, 0).observed.earth.raw, date);
    if (dirPA !== pd.direction) setDirPA(pd.direction);
    // создаем камеру, которая вращается вокруг заданной цели (это может быть меш или точка)
    const camera = new ArcRotateCamera("Camera", 0, 0, 0, new Vector3(0, 0, 0), scene);
    scene.activeCamera = camera;
    camera.attachControl(reactCanvas, true);
    camera.fov = 1.5;
    // camera.lowerBetaLimit = 0.5;
    // camera.upperBetaLimit = 2.5;
    camera.lowerRadiusLimit = config.PLANET_RADIUS;
    camera.upperRadiusLimit = config.PLANET_RADIUS * 2;
    camera.radius = config.PLANET_RADIUS + 30;
    // создаем скайбокс
    const skybox = MeshBuilder.CreateBox("universe", { size: 10000.0 }, scene); // создаем гигантский куб
    const skyboxMaterial = new StandardMaterial("universe", scene); // создаем материал
    skyboxMaterial.backFaceCulling = false; // Включаем видимость меша изнутри
    skyboxMaterial.reflectionTexture = new CubeTexture("textures/universe/universe", scene); // задаем текстуру скайбокса как текстуру отражения
    skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE; // настраиваем скайбокс текстуру так, чтобы грани были повернуты правильно друг к другу
    skyboxMaterial.disableLighting = true; // отключаем влияние света
    skybox.material = skyboxMaterial; // задаем матерал мешу
    skybox.position = new Vector3(0, 0, 0);
    const glowLayer = new GlowLayer("glow", scene);
    glowLayer.intensity = 0.5;
    // Земля
    const planet = MeshBuilder.CreateSphere("planet", { segments: config.PLANET_V, diameter: config.PLANET_RADIUS }, scene);
    // const line = MeshBuilder.CreateLines("line", { points: [new Vector3(0, -50, 0), new Vector3(0, 50, 0)] }, scene);
    // line.parent = planet;
    planet.applyDisplacementMap("textures/earth-height.png", 0, 1); // применяем карту высот - смещение => от 0 для черных фрагментов до 1 для белых
    const pivot = new TransformNode("pivot", scene);
    pivot.position.x = (pd.position.x / this.maxDistance) * 700;
    pivot.position.y = (pd.position.y / this.maxDistance) * 700;
    pivot.position.z = (pd.position.z / this.maxDistance) * 700;
    planet.parent = pivot;
    const moonPivot = new TransformNode("moonPivot", scene);
    moonPivot.position.x = pivot.position.x;
    moonPivot.position.y = pivot.position.y;
    moonPivot.position.z = pivot.position.z;
    drawMoonOrbit(date);// scene, , moonPivot
    const moon = MeshBuilder.CreateSphere("moon", { segments: 25, diameter: config.MOON_RADIUS }, scene); // Луна
    moon.parent = moonPivot; // задаем родителя - Землю
    const pM = Ephemeris.getPlanet('moon', utcTime, 0, 0, 0).observed.moon.raw.position;
    this.prevSE = pM.sunElongation;
    const md = convertLunarCoordinates(pM, date);
    if (dirMA !== md.direction) setDirMA(md.direction);
    if (dirMD !== md.days) setDirMD(md.days);
    if (phaM !== md.phase) setPhaM(md.phase);
    if (dayM !== md.dayM) setDayM(md.dayM);
    moon.position.x = (md.position.x / this.maxDistanceM) * 200;
    moon.position.y = (md.position.y / this.maxDistanceM) * 200;
    moon.position.z = (md.position.z / this.maxDistanceM) * 200;
    moon.position.z = (md.z / this.maxDistanceM) * 200;
    const moonMat = new StandardMaterial("moonMat", scene); // Материал Луны
    moonMat.diffuseTexture = new Texture("textures/moon.jpg", scene); // задаем базовую текстуру
    moonMat.bumpTexture = new Texture("textures/moon_bump.jpg", scene);
    moonMat.specularTexture = new Texture("textures/moon_spec.jpg", scene);

    moon.material = moonMat; // задаем луне материал

    // создаем точечный источник света в точке 0,0,0
    const lightSourceMesh = new PointLight("Omni", new Vector3(0.0, 0.0, 0.0), scene);
    /* цвет света */
    lightSourceMesh.diffuse = new Color3(0.5, 0.5, 0.5);

    // Материал Земли
    const planetMat = new ShaderMaterial("planetMat", scene, "shPlanet",
    {
      attributes: ["position", "normal", "uv"],
      uniforms: ["world", "worldView", "worldViewProjection", "diffuseTexture", "nightTexture"],
    });

    const diffuseTexture = new Texture("textures/earth-diffuse.jpg", scene);
    const nightTexture = new Texture("textures/earth-night-o2.png", scene);

    planetMat.setVector3("vLightPosition", lightSourceMesh.position); // задаем позицию источника света
    planetMat.setTexture("diffuseTexture", diffuseTexture); // задаем базовую текстуру материалу
    planetMat.setTexture("nightTexture", nightTexture);// задаем ночную текстуру материалу

    planetMat.backFaceCulling = false;
    planet.material = planetMat;
    // Создание маркера
    const marker = MeshBuilder.CreateSphere('llMarker', { diameter: 0.3 }, scene);
    const LL = calculateLL(date, utcTime);
    const zp = calculateZenithPosition(Ephemeris.getPlanet('sun', utcTime, 0, 0, 0).observed.sun.raw.position.apparent,utcTime);
    const tp = llToXYZ(zp.latitude, LL.longitude);
    marker.position = tp;
    marker.material = new StandardMaterial("llMarkerMat", scene);
    marker.material.diffuseColor = new Color3(1, 0, 0); // Красный цвет
    marker.parent = planet;
    pivot.rotation.z = zp.latitude * (Math.PI / 180);
    pivot.rotation.x = pivot.rotation.z;
    planet.rotation.y = -(zp.longitude * (Math.PI / 180));
    const tiltMatrix = Matrix.RotationZ(pivot.rotation.z);
    const rotationMatrix = Matrix.RotationY(planet.rotation.y);
    const rotatedSurfacePointLocal = Vector3.TransformCoordinates(tp, rotationMatrix.multiply(tiltMatrix));
    const surfacePointGlobal = planet.position.add(rotatedSurfacePointLocal.scale(1));
    const surfaceNormal = surfacePointGlobal.subtract(planet.position).normalize();
    const cameraGlobalPosition = surfacePointGlobal.add(surfaceNormal.scale(45));
    camera.setPosition(cameraGlobalPosition);
    // camera.lockedTarget = planet;
// Атмосфера
    const cloudsMaterial = new ShaderMaterial("cloudsMaterial", scene, "shClouds",
    {
      attributes: ["position", "normal", "uv"],
      uniforms: ["world", "worldView", "worldViewProjection", "cloudsTexture", "lightPosition", "cameraPosition"],
      needAlphaBlending: true,
    });

    const cloudsTexture = new Texture("textures/earth-c.jpg", scene);

    cloudsMaterial.setTexture("cloudsTexture", cloudsTexture);
    cloudsMaterial.setVector3("cameraPosition", Vector3.Zero());
//        cloudsMaterial.backFaceCulling = false;

    const cloudsMesh = MeshBuilder.CreateSphere("clouds", { segments: config.PLANET_V, diameter: config.PLANET_RADIUS + config.ENV_H }, scene);
    cloudsMesh.material = cloudsMaterial;
    cloudsMesh.rotation.z = Math.PI;
    cloudsMesh.parent = planet;

    // солнце
    const sun = MeshBuilder.CreateSphere("sun", { segments: 15, diameter: config.SUN_RADIUS }, scene);
    // создаем материал для Солнца
    const sunMaterial = new StandardMaterial("sunMaterial", scene);
    // создаем процедурную текстуру (128 - это разрешение)
    const fireTexture = new FireProceduralTexture("fire", 128, scene);
    // задаем 6 основных цветов
    fireTexture.fireColors = [
      new Color3(1.0,0.7,0.3),
      new Color3(1.0,0.7,0.3),
      new Color3(1.0,0.5,0.0),
      new Color3(1.0,0.5,0.0),
      new Color3(1.0,1.0,1.0),
      new Color3(1.0,0.5,0.0),
    ];

    // задаем материалу emissiveTexture
    sunMaterial.emissiveTexture = fireTexture;
    sun.material = sunMaterial; // присваиваем материал
    sun.parent = lightSourceMesh; // прикрепляем Солнце к источнику света
    camera.lockedTarget = sun;

    // создаем эффект god rays (name, pixel ratio, camera, целевой меш, quality, метод фильтрации, engine, флаг reusable)
    // const godrays = new VolumetricLightScatteringPostProcess('godrays', 1.0, camera, sun, 100, Texture.BILINEAR_SAMPLINGMODE, engine, false);

    // godrays.exposure = 0.95;
    // godrays.decay = 0.96815;
    // godrays.weight = 0.78767;
    // godrays.density = 1.0;

        /* Раскомментируйте чтобы инициировать нужный эффект */
//        var postProcess = new BABYLON.BlackAndWhitePostProcess("bandw", 1.0, null, null, engine, true); //black and white
//        var postProcess = new BABYLON.BlurPostProcess("Horizontal blur", new BABYLON.Vector2(1.5, 0), 1.0, 1.0, null, null, engine, true); //blur
//        var postProcess = new BABYLON.FxaaPostProcess("fxaa", 1.0, null, null, engine, true); //fxaa
        /* добавляем эффект к камере */
//        camera.attachPostProcess(postProcess);

    // генерируем космическую пыль
    // const spriteManagerDust = new SpriteManager("dustManager", "textures/particle32.png", config.DUST, 32, scene);
    // function generateSpaceDust() {
    //     for (let i = 0; i < config.DUST; i++) {
    //         const dust = new Sprite("dust", spriteManagerDust); //саоздаем спрайт
    //         dust.position.x = Math.random() * 500 - 250; //случайная позиция x
    //         dust.position.z = Math.random() * 500 - 250;//случайная позиция y
    //         dust.position.y = Math.random() * 150 - 75;//случайная позиция z
    //         dust.size = 0.4; //задаем размер - 0.2 от максимального
    //     }
    // }
    // generateSpaceDust();
    // const pipeline = new DefaultRenderingPipeline("defaultPipeline", true, scene, [camera]);
    // pipeline.imageProcessingEnabled = true;
    // pipeline.imageProcessing.contrast = 1.2; // увеличиваем контраст
    // pipeline.imageProcessing.exposure = 1.2; // увеличиваем экспозицию
    
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    advancedTexture.renderScale = 1.0;
    const uiPanel = new StackPanel();
    uiPanel.width = "98%";
    uiPanel.height = "110px";
    uiPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    uiPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    const buiPanel = new StackPanel();
    buiPanel.width = "230px";
    buiPanel.height = "90px";
    buiPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    buiPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    buiPanel.top = "70px";
    const menuContainer = new Rectangle();
    menuContainer.width = "200px";
    menuContainer.height = "90px";
    menuContainer.color = "#005555";
    menuContainer.thickness = 0.5;
    menuContainer.background = "#CCCDCECC";
    menuContainer.isVisible = false;
    menuContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    menuContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    menuContainer.cornerRadius = 5;
    const btnMenu = new TextBlock();
    btnMenu.hoverCursor = "Pointer";
    btnMenu.fontSizeInPixels = 48;
    btnMenu.text = "≡";
    btnMenu.width = "60px";
    btnMenu.height = "70px";
    btnMenu.color = "#CCCDCE";
    btnMenu.isPointerBlocker = true;
    btnMenu.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    btnMenu.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    btnMenu.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    btnMenu.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    btnMenu.onPointerDownObservable.add(() => {
      if (menuContainer) {
        menuContainer.isVisible = !menuContainer.isVisible;
      }
      // if (engine !== null) {
      //   engine.stopRenderLoop();
      // }
      // if (scene !== null) {
      //     scene.dispose();
      // }
      // if (engine !== null) {
      //   engine.dispose();
      // }
      // setScene(null);
      // setEngine(null);
      // navigate('/chat');
    });
    const separator = new Line();
    separator.x1 = "0px";
    separator.y1 = "29.5px";
    separator.x2 = "200px";
    separator.y2 = "29.5px";
    separator.color = "grey";
    separator.lineWidth = 1;
    menuContainer.addControl(separator);
    const menuItem2 = new TextBlock();
    menuItem2.text = "Начальная позиция";
    menuItem2.height = "30px";
    menuItem2.color = "#005555";
    menuItem2.hoverCursor = "Pointer";
    menuItem2.isPointerBlocker = true;
    menuItem2.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    menuItem2.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    menuItem2.onPointerUpObservable.add(() => {
      if (menuContainer) {
        menuContainer.isVisible = !menuContainer.isVisible;
      }
      if (scene) {
        const mPlanet = scene.getMeshByName("planet");
        const mPivot = scene.getTransformNodeByName("pivot");
        const mCamera = scene.getCameraByName("Camera");
        if (mCamera && mPlanet && mPivot) {
          const date = new Date();
          const timezoneOffset = date.getTimezoneOffset() * 60000;
          const utcTime = new Date(date.getTime() + timezoneOffset);
          const zp = calculateZenithPosition(Ephemeris.getPlanet('sun', utcTime, 0, 0, 0).observed.sun.raw.position.apparent,utcTime);
          const LL = calculateLL(date, utcTime);
          const tp = llToXYZ(zp.latitude, LL.longitude);
          mPivot.rotation.z = zp.latitude * (Math.PI / 180);
          mPivot.rotation.x = mPivot.rotation.z;
          mPlanet.rotation.y = -(zp.longitude * (Math.PI / 180));
          const tiltMatrix = Matrix.RotationZ(mPivot.rotation.z);
          const rotationMatrix = Matrix.RotationY(mPlanet.rotation.y);
          const rotatedSurfacePointLocal = Vector3.TransformCoordinates(tp, rotationMatrix.multiply(tiltMatrix));
          const surfacePointGlobal = mPlanet.position.add(rotatedSurfacePointLocal.scale(1));
          const surfaceNormal = surfacePointGlobal.subtract(mPlanet.position).normalize();
          const cameraGlobalPosition = surfacePointGlobal.add(surfaceNormal.scale(45));
          mCamera.detachControl(reactCanvas);
          mCamera.setPosition(cameraGlobalPosition);
          mCamera.lockedTarget = null;
          mCamera.attachControl(reactCanvas, true);
          scene.render();
          mCamera.detachControl(reactCanvas);
          mCamera.setPosition(cameraGlobalPosition);
          mCamera.lockedTarget = mPlanet;
          mCamera.attachControl(reactCanvas, true);
          scene.render();
        }
      }
    });
    menuContainer.addControl(menuItem2);
    const menuItem3 = new TextBlock();
    menuItem3.text = "ЧАТ ТЕХПОДДЕРЖКИ";
    menuItem3.height = "30px";
    menuItem3.color = "#005555";
    menuItem3.hoverCursor = "Pointer";
    menuItem3.isPointerBlocker = true;
    menuItem3.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    menuItem3.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    menuItem3.onPointerUpObservable.add(() => {
      if (menuContainer) {
        menuContainer.isVisible = !menuContainer.isVisible;
      }
      try {
        window.open("tg://resolve?domain=NewTime5D", '_blank');
      } catch (error) {
        window.open("https://t.me/NewTime5D", '_blank');
      }
    });
    menuContainer.addControl(menuItem3);
    const tbTD = new TextBlock();
    tbTD.fontSizeInPixels = 15;
    tbTD.width = "320";
    tbTD.height = "20px";
    tbTD.color = "#CCCDCE";
    tbTD.isPointerBlocker = false;
    tbTD.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    tbTD.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    tbTD.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    tbTD.top = 80;
    const tbNT = new TextBlock();
    tbNT.fontSizeInPixels = 34;
    tbNT.hoverCursor = "Pointer";
    tbNT.width = "200px";
    tbNT.height = "34px";
    tbNT.color = "#CCCDCE";
    tbNT.isPointerBlocker = true;
    tbNT.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    tbNT.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    tbNT.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    tbNT.top = 40;
    // tbNT.onPointerUpObservable.add(() => {
    //     setShowNT(true);
    // });
    const tbDA = new TextBlock();
    tbDA.fontSizeInPixels = 15;
    tbDA.width = "100%";
    tbDA.height = "40px";
    tbDA.color = "#CCCDCE";
    tbDA.textWrapping = true;
    tbDA.lineSpacing = -1;
    tbDA.isPointerBlocker = false;
    tbDA.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    tbDA.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    tbDA.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    const tbMP = new TextBlock();
    tbMP.fontSizeInPixels = 15;
    tbMP.width = "100%";
    tbMP.height = "20px";
    tbMP.color = "#CCCDCE";
    tbMP.isPointerBlocker = false;
    tbMP.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    tbMP.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    tbMP.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    const tbMA = new TextBlock();
    tbMA.fontSizeInPixels = 15;
    tbMA.width = "100%";
    tbMA.height = "20px";
    tbMA.color = "#CCCDCE";
    tbMA.isPointerBlocker = false;
    tbMA.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    tbMA.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    tbMA.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    const tbM = new TextBlock();
    tbM.fontSizeInPixels = 17;
    tbM.text = "Луна:";
    tbM.width = "100%";
    tbM.height = "20px";
    tbM.color = "#CCCDCE";
    tbM.isPointerBlocker = false;
    tbM.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    tbM.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    tbM.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    uiPanel.addControl(tbM);
    uiPanel.addControl(tbMP);
    uiPanel.addControl(tbMA);
    uiPanel.addControl(tbDA);
    buiPanel.addControl(menuContainer);
    setTbNT(tbNT);  
    setTbDA(tbDA);  
    setTbMA(tbMA);  
    setTbMP(tbMP);  
    setTbTD(tbTD);  
    setUiPanel(uiPanel);  
    setBtnMenu(btnMenu);  
    setBuiPanel(buiPanel);  
    setMenuItem2(menuItem2);  
    setMenuContainer(menuContainer);  
    setAdvancedTexture(advancedTexture);  
  };
// var currentCamera = arcCamera;
// function switchCamera() {
//     if (currentCamera === arcCamera) {
//         arcCamera.detachControl(canvas);
//         currentCamera = universalCamera;
//         var cameraPosition = new BABYLON.Vector3(x, y, z);
//         var camera = new BABYLON.UniversalCamera("camera", cameraPosition, scene);
//         var forwardVector = new BABYLON.Vector3(-x, -y, -z).normalize();
//         camera.setTarget(cameraPosition.add(forwardVector));
//         camera.attachControl(canvas, true);
//     } else {
//         universalCamera.detachControl(canvas);
//         camera.setTarget(tp);
//         var cameraRadius = 5;
//         var cameraX = cameraRadius * Math.cos(latitude) * Math.cos(longitude + Math.PI); // Смещение по долготе на 180 градусов
//         var cameraY = cameraRadius * Math.sin(latitude);
//         var cameraZ = cameraRadius * Math.cos(latitude) * Math.sin(longitude + Math.PI);
//         camera.setPosition(new BABYLON.Vector3(cameraX, cameraY, cameraZ));
//         arcCamera.attachControl(canvas, true);
//         currentCamera = arcCamera;
//     }
//     scene.activeCamera = currentCamera;
// }

  useEffect(() => {
    if (!menuItem2 || !menuContainer ) return;
    // menuItem1.text = "Тенденции Дня";//adm ? "Тенденции Дня(adm)" : "Тенденции Дня";
    menuItem2.onPointerUpObservable.add(() => {
      if (menuContainer) {
        menuContainer.isVisible = !menuContainer.isVisible;
      }
      // if (adm) {
      //   if (engine !== null) {
      //     engine.stopRenderLoop();
      //   }
      //   if (scene !== null) {
      //       scene.dispose();
      //   }
      //   if (engine !== null) {
      //     engine.dispose();
      //   }
      //   setScene(null);
      //   setEngine(null);
      //   navigate('/nt');
      // } else {
      //   setShowNT(true);
      // }
    });
  }, [menuItem2,menuContainer])

  useEffect(() => {
    if (!start || !advancedTexture || !uiPanel || !btnMenu || !tbTD || !tbNT || !buiPanel) return;
    advancedTexture.addControl(tbTD);
    advancedTexture.addControl(tbNT);
    advancedTexture.addControl(uiPanel);
    advancedTexture.addControl(btnMenu);
    advancedTexture.addControl(buiPanel);
  }, [start,advancedTexture,uiPanel,btnMenu,tbTD,tbNT,buiPanel])

  useEffect(() => {
    if (!tbTD) return;
    tbTD.text = tDate;
  }, [tbTD, tDate])

  useEffect(() => {
    if (!tbNT) return;
    tbNT.text = CNT;
  }, [tbNT, CNT])

  useEffect(() => {
    if (!tbDA) return;
    tbDA.text = `${dirPA ? 'Восходящее' : 'Нисходящее'  } движение активности природных сил.`;
  }, [tbDA, CNT, dirPA])

  useEffect(() => {
    if (!tbMA) return;
    tbMA.text = `${this.daysNum[dirMD]} день движения Луны ${  dirMA ? 'к апогею.' : 'к перигею.'}`;
  }, [tbMA, dirMA, dirMD])

  useEffect(() => {
    if (!tbMP) return;
    tbMP.text = `возраст ${dayM.toString()} д., `;
    if (phaM===0) {
      tbMP.text += 'новолуние,';
    } else if (phaM===1) {
      tbMP.text += 'растущий серп,';
    } else if (phaM===2) {
      tbMP.text += 'первая четверть,';
    } else if (phaM===3) {
      tbMP.text += 'растущая Луна,';
    } else if (phaM===4) {
      tbMP.text += 'полнолуние,';
    } else if (phaM===5) {
      tbMP.text += 'убывающая Луна,';
    } else if (phaM===6) {
      tbMP.text += 'последняя четверть,';
    } else if (phaM===7) {
      tbMP.text += 'убывающий серп,';
    }
  }, [tbMP, phaM, dayM])

  useEffect(() => {
    if (window) {
      const resize = () => {
        if (scene) {
          reactCanvas.current.width = window.innerWidth;
          reactCanvas.current.height = window.innerHeight;
          scene.getEngine().resize();
          advancedTexture.scaleTo(scene.getEngine().getRenderWidth(), scene.getEngine().getRenderHeight());
        }
      }
      window.addEventListener("resize", resize);
      window.addEventListener("orientationchange", resize);
      return () => {
        window.removeEventListener("resize", resize);
        window.removeEventListener("orientationchange", resize);
      }
    }
  }, [scene])

  useEffect(() => {
    if (!reactCanvas.current) { return; }
    function isTransformNodeReady(transformNode) {
      if (transformNode.getChildTransformNodes().length === 0) {
          return true;
      }
      return transformNode.getChildTransformNodes().every(childNode => {
          if (childNode instanceof Mesh) {
              return childNode.isReady(true);
          } if (childNode instanceof TransformNode) {
              return isTransformNodeReady(childNode);
          }
          return true;
      });
    }
    if (!loaded) {
      setLoaded(true);
      reactCanvas.current.width = window.innerWidth;
      reactCanvas.current.height = window.innerHeight;
      const engine = new Engine(
        reactCanvas.current,
        false
      );
      const scene = new Scene(engine);
      this.NT = [];
      const udy = { u: 1344643200000, d: 0, y: 0 };
      while (udy.u < 4090089600000) {
        this.NT.push({ ...udy });
        if (udy.y === 11 && udy.d === 121) {
          udy.u += 43229589.41095890410959;
          udy.d += 1;
          this.NT.push({ ...udy });
          udy.u += 43229589.41095890410959;
          udy.d += 1;
          this.NT.push({ ...udy });
        } else {
          udy.u += 86459178.082191780821918;
          udy.d += 1;
        }
        if (udy.d === 365) {
          udy.d = 0;
          udy.y += 1;
        }
      }
      this.DDD = new Date();
      handleDateChange(this.DDD);
      this.month = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
      this.days = ["воскресенье","понедельник","вторник","среда","четверг","пятница","суббота"];
      this.daysNum = ["первый","второй","третий","четвертый","пятый","шестой","седьмой","восьмой","девятый","десятый","одиннадцатый","двенадцатый","тринадцатый","четырнадцатый","пятнадцатый","шестнадцатый","семнадцатый","восемнадцатый","девятнадцатый","двадцатый"];
      this.prevSE = 0;
      this.prevIncSE = false;
      this.apogeePoint = null;
      this.perigeePoint = null;
      this.apogeePointM = null;
      this.perigeePointM = null;
      this.minDistance = Number.MAX_VALUE;
      this.maxDistance = 0;
      this.minDistanceM = Number.MAX_VALUE;
      this.maxDistanceM = 0;
      this.starScale = 8.8;
      this.radius = 4990;
      this.ShowAsterisms = true;
      this.asterismColor = new Color3(0, 0, .6);
      this.twinkleStars = false;
      this.starNoise = false;
      this.showMilkyWay = false;
      setEngine(engine);
      setScene(scene);
      if (scene.isReady()) {
        onSceneReady(scene, engine);
      } else {
        scene.onReadyObservable.addOnce((scene, engine) => onSceneReady(scene, engine));
      }

      engine.stopRenderLoop();
      engine.runRenderLoop(() => {
        const mPlanet = scene.getMeshByName("planet");
        const mPivot = scene.getTransformNodeByName("pivot");
        const mMoonPivot = scene.getTransformNodeByName("moonPivot");
        const mMoon = scene.getMeshByName("moon");
        const mOmni = scene.getLightByName("Omni");
        const mMarker = scene.getMeshByName("llMarker");
        if (mMoonPivot && mPivot && mPlanet && mMoon && mOmni && mMarker) { // && mMarker
          const date = new Date();
          if ((date.getTime() - this.DDD.getTime()) > 333333) {this.DDD = date; setIsDDD(true);}
          const timezoneOffset = date.getTimezoneOffset() * 60000;
          const utcTime = new Date(date.getTime() + timezoneOffset);
          const pd = calculateEarthPosition(Ephemeris.getPlanet('earth', utcTime, 0, 0, 0).observed.earth.raw, date);
          const sec = date.getSeconds();
          if (tDateS !== sec) {
            const tDn = this.days[date.getDay()];
            const tD = date.getDate().toString();
            const tM = this.month[date.getMonth()];
            const tH = `00${date.getHours().toString()}`;
            const tMm = `00${date.getMinutes().toString()}`;
            const tS = `00${sec.toString()}`;
            setTDate(`${tH.substring(tH.length - 2)}:${tMm.substring(tMm.length - 2)}:${tS.substring(tS.length - 2)  }, ${  tDn  }, ${  tD  } ${  tM  } ${  date.getFullYear().toString()  } г.`);
            setTDateS(sec);
          }
          if (dirPA !== pd.direction) setDirPA(pd.direction);
          mPivot.position.x = (pd.position.x / this.maxDistance) * 700;
          mPivot.position.y = (pd.position.y / this.maxDistance) * 700;
          mPivot.position.z = (pd.position.z / this.maxDistance) * 700;
          mMoonPivot.position.x = mPivot.position.x;
          mMoonPivot.position.y = mPivot.position.y;
          mMoonPivot.position.z = mPivot.position.z;
          const zp = calculateZenithPosition(Ephemeris.getPlanet('sun', utcTime, 0, 0, 0).observed.sun.raw.position.apparent,utcTime);
          mPivot.rotation.z = zp.latitude * (Math.PI / 180);
          mPivot.rotation.x = mPivot.rotation.z;
          mPlanet.rotation.y = -(zp.longitude * (Math.PI / 180));
          mMarker.position = llToXYZ(-zp.latitude, -(zp.longitude-7 + (pd.trueAnomaly/Math.PI*180)));
          // const mMm = scene.getMeshByName("line1");
          // if (mMm) {
          //   mMm.dispose();
          // }
          // const line = MeshBuilder.CreateLines("line1", { points: [mPivot.position, new Vector3(0, 0, 0)] }, scene);
          const shaderMaterial = scene.getMaterialByName("cloudsMaterial");
          shaderMaterial.setVector3("cameraPosition", scene.activeCamera.position);
          shaderMaterial.setVector3("lightPosition", mOmni.position);
          const md = convertLunarCoordinates(Ephemeris.getPlanet('moon', utcTime, 0, 0, 0).observed.moon.raw.position, date);
          if (dirMA !== md.direction) setDirMA(md.direction);
          if (dirMD !== md.days) setDirMD(md.days);
          if (phaM !== md.phase) setPhaM(md.phase);
          if (dayM !== md.dayM) setDayM(md.dayM);
          mMoon.position.x = (md.position.x / this.maxDistanceM) * 200;
          mMoon.position.y = (md.position.y / this.maxDistanceM) * 200;
          mMoon.position.z = (md.position.z / this.maxDistanceM) * 200;
          if (!isLoaded && scene.meshes.every(mesh => mesh.isReady(true)) && scene.lights.every(light => light.isReady()) && scene.activeCamera && scene.activeCamera.isReady() && scene.transformNodes.every(node => isTransformNodeReady(node))) setIsLoaded(true);
        }
        scene.render();
      })
    }

    return () => {
      if (engine !== null) {
        engine.stopRenderLoop();
      }
      if (scene !== null) {
          scene.dispose();
      }
      if (engine !== null) {
        engine.dispose();
      }
      setScene(null);
      setEngine(null);
    }
  }, [reactCanvas])

  useEffect(() => {
    if (scene && isDDD) {
      setIsDDD(false);
      handleDateChange(this.DDD);
      //const mMoonPivot = scene.getTransformNodeByName("moonPivot");
      //if (mMoonPivot)
      if (this.DDD.getDate() < 9 && (this.DDD.getMonth() === 0 || this.DDD.getMonth() === 6)) drawEarthOrbit(this.DDD);// scene, 
      drawMoonOrbit(this.DDD);// scene, , mMoonPivot
    }
  }, [isDDD])

  return (
    <>
      <canvas id="gameCanvas" ref={reactCanvas} style={{ touchAction: 'none' }} />
      {!isLoaded && (
        <>
          <Text position="absolute" top="22px" left="22px" align="center" borderWidth="1px" borderColor="black" borderRadius="6px" bg="#2d374880" color="#329060ff" fontWeight="bold" zIndex="9" >
            ПОДОЖДИТЕ, ИДЕТ ЗАГРУЗКА...
          </Text>
          <Spinner />
        </>
      )}
    </>
  )
}
