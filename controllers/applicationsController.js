require('dotenv').config();
const db = require('../database/db');
const { DateTime } = require("luxon");


class ApplicationsController {
 
  async add(req, res) {
  try {
    const { tg_username, time, network, amount, type, address, date } = req.body;

    // 1. Текущее время и дата в МСК
    const nowMSK = DateTime.now().setZone("Europe/Moscow");
    const nowTime = nowMSK.toFormat("HH:mm:ss");
    const nowDate = date || nowMSK.toFormat("yyyy-MM-dd");
    const nowTimestamp = nowMSK.toFormat("yyyy-MM-dd HH:mm:ss");
    

    // 2. Проверяем, есть ли у пользователя активная заявка с time >= текущего времени
    const existingApp = await db("applications")
  .whereRaw(`to_timestamp(date || ' ' || time, 'YYYY-MM-DD HH24:MI:SS') >= ?`, [nowTimestamp])
  .andWhere("tg_username", tg_username)
  .first();

    if (existingApp) {
      return res.status(400).json({ error: "У пользователя уже есть активная заявка на будущее/сейчас" });
    }

    // 3. Получаем список занятых операторов (у которых есть заявки на будущее/сейчас)
    const busyOperators = await db("applications")
  .whereRaw(`to_timestamp(date || ' ' || time, 'YYYY-MM-DD HH24:MI:SS') >= ?`, [nowTimestamp])
  .pluck("operator_id");

    // 4. Находим свободных операторов
    const freeOperators = await db("operators")
      .whereNotIn("id", busyOperators);

    if (!freeOperators.length) {
      return res.status(400).json({ error: "Нет свободных операторов" });
    }

    // 5. Случайный оператор
    const randomOperator = freeOperators[Math.floor(Math.random() * freeOperators.length)];

    // 6. Создаём заявку
    const [inserted] = await db("applications")
      .insert({
        tg_username,
        time,
        date: nowDate,
        network,
        amount,
        type,
        address,
        operator_id: randomOperator.id,
      })
      .returning("id");

    res.status(201).json({ id: inserted.id, operator_id: randomOperator.id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}


  async delete(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID заявки не передан" });
    }

    // Проверяем, существует ли заявка
    const existingApp = await db("applications").where({ id }).first();
    if (!existingApp) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }

    // Удаляем заявку
    await db("applications").where({ id }).del();

    res.status(200).json({ message: "Заявка успешно удалена" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}


  async getAvailableHours(req, res) {
  try {
    const { date } = req.params;
    if (!date) return res.status(400).json({ error: "Дата не передана" });

    const nowMSK = DateTime.now().setZone("Europe/Moscow").toFormat("HH:mm:ss");

    // 1. Берём единственный интервал работы
    const interval = await db("hours").first("start", "end");
    if (!interval) return res.status(400).json({ error: "Нет интервала работы" });
    

    // 2. Берём все заявки на эту дату
    const apps = await db("applications")
      .where("date", date)
      .select("time", "operator_id");
     
      console.log(apps);
    // 3. Берём всех операторов
    const operators = await db("operators").pluck("id");
    


    const freeSlots = [];

    // 4. Разбиваем интервал на 15-минутные слоты
    let slotStart = DateTime.fromFormat(interval.start, "HH:mm:ss", { zone: "Europe/Moscow" });

const slotEnd = DateTime.fromFormat(interval.end, "HH:mm:ss", { zone: "Europe/Moscow" });



    while (slotStart < slotEnd) {
      const slotTimeStr = slotStart.toFormat("HH:mm:ss");

      // Проверяем занятых операторов в этом окне
      const busyOps = apps
        .filter(app => app.time === slotTimeStr)
        .map(app => app.operator_id);
        

      // Если есть хотя бы один свободный оператор
      if (operators.some(op => !busyOps.includes(op))) {
        freeSlots.push(slotTimeStr);
      }

      // Переходим к следующему слоту через 15 минут
      slotStart = slotStart.plus({ minutes: 15 });
    }
    
    res.status(200).json({ date, freeSlots });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
async getByDate(req, res) {
  try {
    const { date } = req.params;
    if (!date) return res.status(400).json({ error: "Дата не передана" });

    // 1. Берём интервал работы
    const hours = await db("hours").first("start", "end");
    if (!hours) return res.status(400).json({ error: "Интервал работы не задан" });

    // 2. Берём все заявки на указанную дату
    const applications = await db("applications")
      .where("date", date)
      .select("id", "tg_username", "time", "network", "amount", "type", "address", "operator_id");

    // 3. Формируем результат
    const result = {
      hours: {
        start: hours.start,
        end: hours.end
      },
      applications
    };

    res.status(200).json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

}
module.exports = new ApplicationsController();

