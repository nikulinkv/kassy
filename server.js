/* eslint-disable no-console */
// импорт стандартных библиотек Node.js
const { existsSync, readFileSync, writeFileSync } = require('fs');
const { createServer } = require('http');

// файл для базы данных
const DB_FILE = process.env.DB_FILE || './events.json';
// номер порта, на котором будет запущен сервер
const PORT = process.env.PORT || 3000;
// префикс URI для всех методов приложения
const URI_PREFIX = '/api/events';

/**
 * Класс ошибки, используется для отправки ответа с определённым кодом и описанием ошибки
 */
class ApiError extends Error {
  constructor(statusCode, data) {
    super();
    this.statusCode = statusCode;
    this.data = data;
  }
}

/**
 * Асинхронно считывает тело запроса и разбирает его как JSON
 * @param {Object} req - Объект HTTP запроса
 * @throws {ApiError} Некорректные данные в аргументе
 * @returns {Object} Объект, созданный из тела запроса
 */
function drainJson(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(JSON.parse(data));
    });
  });
}

/**
 * Проверяет входные данные и создаёт из них корректный объект мероприятия
 * @param {Object} data - Объект с входными данными
 * @throws {ApiError} Некорректные данные в аргументе (statusCode 422)
 * @returns {{ place: string, event: string, startedAt: string, endedAt: string, summ: string }} Объект мероприятия
 */
function makeEventFromData(data) {
  const errors = [];

  function asString(v) {
    return v && String(v).trim() || '';
  }

  // составляем объект, где есть только необходимые поля
  const city = {
    place: asString(data.place),
    event: asString(data.event),
    startedAt: asString(data.startedAt),
    endedAt: asString(data.endedAt),
    summ: asString(data.summ)
  };

//   // проверяем, все ли данные корректные и заполняем объект ошибок, которые нужно отдать клиенту
//   if (!client.name) errors.push({ field: 'name', message: 'Не указано имя' });
//   if (!client.surname) errors.push({ field: 'surname', message: 'Не указана фамилия' });
//   if (client.contacts.some(contact => !contact.type || !contact.value))
//     errors.push({ field: 'contacts', message: 'Не все добавленные контакты полностью заполнены' });

//   // если есть ошибки, то бросаем объект ошибки с их списком и 422 статусом
//   if (errors.length) throw new ApiError(422, { errors });

  return city;
}

/**
 * Возвращает список мероприятий из базы данных
 * @param {{ search: string }} [params] - Поисковая строка
 * @returns {{ place: string, event: string, startedAt: string, endedAt: string, summ: string }[]} Массив мероприятий
 */
function getEventList(params = {}) {
  const events = JSON.parse(readFileSync(DB_FILE) || '[]');
  if (params.search) {
    const search = params.search.trim().toLowerCase();
    return events.filter(event => [
        event.event,
      ]
        .some(str => str.toLowerCase().includes(search))
    );
  }
  return events;
}

/**
 * Создаёт и сохраняет мероприятие в базу данных
 * @throws {ApiError} Некорректные данные в аргументе, мероприятие не создано (statusCode 422)
 * @param {Object} data - Данные из тела запроса
 * @returns {{ place: string, event: string, startedAt: string, endedAt: string, summ: string }} Объект мероприятия
 */
function createEvent(data) {
  const newItem = makeEventFromData(data);
  newItem.id = Date.now().toString();
  newItem.createdAt = newItem.updatedAt = new Date().toISOString();
  writeFileSync(DB_FILE, JSON.stringify([...getEventList(), newItem]), { encoding: 'utf8' });
  return newItem;
}

/**
 * Возвращает объект мероприятия по его ID
 * @param {string} itemId - ID мероприятия
 * @throws {ApiError} Мероприятие с таким ID не найдено (statusCode 404)
 * @returns {{ place: string, event: string, startedAt: string, endedAt: string, summ: string, createdAt: string, updatedAt: string }} Объект мероприятия
 */
function getEvent(itemId) {
  const event = getEventList().find(({ id }) => id === itemId);
  if (!event) throw new ApiError(404, { message: 'Event Not Found' });
  return event;
}

/**
 * Изменяет мероприятия с указанным ID и сохраняет изменения в базу данных
 * @param {string} itemId - ID изменяемого города
 * @param {{ place?: string, event?: string, startedAt?: string, endedAt?: string, summ?: string }} data - Объект с изменяемыми данными
 * @throws {ApiError} Мероприятие с таким ID не найдено (statusCode 404)
 * @throws {ApiError} Некорректные данные в аргументе (statusCode 422)
 * @returns {{ place: string, event: string, startedAt: string, endedAt: string, summ: string, createdAt: string, updatedAt: string }} Объект мероприятия
 */
function updateEvent(itemId, data) {
  const events = getEventList();
  const itemIndex = events.findIndex(({ id }) => id === itemId);
  if (itemIndex === -1) throw new ApiError(404, { message: 'Event Not Found' });
  Object.assign(events[itemIndex], makeEventFromData({ ...events[itemIndex], ...data }));
  events[itemIndex].updatedAt = new Date().toISOString();
  writeFileSync(DB_FILE, JSON.stringify(events), { encoding: 'utf8' });
  return events[itemIndex];
}

/**
 * Удаляет мероприятие из базы данных
 * @param {string} itemId - ID мероприятия
 * @returns {{}}
 */
function deleteEvent(itemId) {
  const events = getEventList();
  const itemIndex = events.findIndex(({ id }) => id === itemId);
  if (itemIndex === -1) throw new ApiError(404, { message: 'Event Not Found' });
  events.splice(itemIndex, 1);
  writeFileSync(DB_FILE, JSON.stringify(events), { encoding: 'utf8' });
  return {};
}

// создаём новый файл с базой данных, если он не существует
if (!existsSync(DB_FILE)) writeFileSync(DB_FILE, '[]', { encoding: 'utf8' });

// создаём HTTP сервер, переданная функция будет реагировать на все запросы к нему
module.exports = createServer(async (req, res) => {
  // req - объект с информацией о запросе, res - объект для управления отправляемым ответом

  // этот заголовок ответа указывает, что тело ответа будет в JSON формате
  res.setHeader('Content-Type', 'application/json');

  // CORS заголовки ответа для поддержки кросс-доменных запросов из браузера
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // запрос с методом OPTIONS может отправлять браузер автоматически для проверки CORS заголовков
  // в этом случае достаточно ответить с пустым телом и этими заголовками
  if (req.method === 'OPTIONS') {
    // end = закончить формировать ответ и отправить его клиенту
    res.end();
    return;
  }

  // если URI не начинается с нужного префикса - можем сразу отдать 404
  if (!req.url || !req.url.startsWith(URI_PREFIX)) {
    res.statusCode = 404;
    res.end(JSON.stringify({ message: 'Not Found' }));
    return;
  }

  // убираем из запроса префикс URI, разбиваем его на путь и параметры
  const [uri, query] = req.url.substr(URI_PREFIX.length).split('?');
  const queryParams = {};

  // параметры могут отсутствовать вообще или иметь вид a=b&b=c
  // во втором случае наполняем объект queryParams { a: 'b', b: 'c' }
  if (query) {
    for (const piece of query.split('&')) {
      const [key, value] = piece.split('=');
      queryParams[key] = value ? decodeURIComponent(value) : '';
    }
  }

  try {
    // обрабатываем запрос и формируем тело ответа
    const body = await (async () => {
      if (uri === '' || uri === '/') {
        // /api/cities
        if (req.method === 'GET') return getEventList(queryParams);
        if (req.method === 'POST') {
          const createdItem = createEvent(await drainJson(req));
          res.statusCode = 201;
          res.setHeader('Access-Control-Expose-Headers', 'Location');
          res.setHeader('Location', `${URI_PREFIX}/${createdItem.id}`);
          return createdItem;
        }
      } else {
        // /api/events/{id}
        // параметр {id} из URI запроса
        const itemId = uri.substr(1);
        if (req.method === 'GET') return getEvent(itemId);
        if (req.method === 'PATCH') return updateEvent(itemId, await drainJson(req));
        if (req.method === 'DELETE') return deleteEvent(itemId);
      }
      return null;
    })();
    res.end(JSON.stringify(body));
  } catch (err) {
    // обрабатываем сгенерированную нами же ошибку
    if (err instanceof ApiError) {
      res.writeHead(err.statusCode);
      res.end(JSON.stringify(err.data));
    } else {
      // если что-то пошло не так - пишем об этом в консоль и возвращаем 500 ошибку сервера
      res.statusCode = 500;
      res.end(JSON.stringify({ message: 'Server Error' }));
      console.error(err);
    }
  }
})
  // выводим инструкцию, как только сервер запустился...
  .on('listening', () => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`Сервер CRM запущен. Вы можете использовать его по адресу http://localhost:${PORT}`);
      console.log('Нажмите CTRL+C, чтобы остановить сервер');
      console.log('Доступные методы:');
      console.log(`GET ${URI_PREFIX} - получить список мероприятия, в query параметр search можно передать поисковый запрос`);
      console.log(`POST ${URI_PREFIX} - создать мероприятие, в теле запроса нужно передать объект { place: string, event: string, startedAt: string, endedAt: string, summ: string }`);
      // console.log(`\events - массив объектов контактов вида { type: string, value: string }`);
      console.log(`GET ${URI_PREFIX}/{id} - получить мероприятие по его ID`);
      console.log(`PATCH ${URI_PREFIX}/{id} - изменить мероприятие с ID, в теле запроса нужно передать объект { place: string, event: string, startedAt: string, endedAt: string, summ: string }`);
      // console.log(`\cities - массив объектов контактов вида { type: string, value: string }`);
      console.log(`DELETE ${URI_PREFIX}/{id} - удалить мероприятие по ID`);
    }
  })
  // ...и вызываем запуск сервера на указанном порту
  .listen(PORT);
