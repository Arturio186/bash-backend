require('dotenv').config();
const {DateTime} = require("luxon");
const db = require('../database/db');

class ApplicationsController {
  async add(req, res) {
    try {
      const { tg_username, time, network, amount, type, address, date } = req.body;

      const nowMSK = DateTime.now().setZone("Europe/Moscow");
      const nowDate = date || nowMSK.toFormat("yyyy-MM-dd");
      const nowTimestamp = nowMSK.toFormat("yyyy-MM-dd HH:mm:ss");
      
      const existingApp = await db("applications")
        .whereRaw(`to_timestamp(date || ' ' || time, 'YYYY-MM-DD HH24:MI:SS') >= ?`, [nowTimestamp])
        .andWhere("tg_username", tg_username)
        .first();

      if (existingApp) {
        return res.status(400).json({ error: "У пользователя уже есть активная заявка на будущее/сейчас" });
      }

      const busyOperators = await db("applications")
        .whereRaw(`to_timestamp(date || ' ' || time, 'YYYY-MM-DD HH24:MI:SS') >= ?`, [nowTimestamp])
        .pluck("operator_id");

      const freeOperators = await db("operators")
        .whereNotIn("id", busyOperators);

      if (!freeOperators.length) {
        return res.status(400).json({ error: "Нет свободных операторов" });
      }

      const randomOperator = freeOperators[Math.floor(Math.random() * freeOperators.length)];

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
      const {id} = req.params;

      if (!id) {
        return res.status(400).json({ error: "ID заявки не передан" });
      }

      const existingApp = await db("applications").where({ id }).first();
      if (!existingApp) {
        return res.status(404).json({ error: "Заявка не найдена" });
      }

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

      const interval = await db("hours").first("start", "end");
      if (!interval) return res.status(400).json({ error: "Нет интервала работы" });
      
      const apps = await db("applications")
        .where("date", date)
        .select("time", "operator_id");
    
      const operators = await db("operators").pluck("id");
    
      const freeSlots = [];

      let slotStart = DateTime.fromFormat(interval.start, "HH:mm:ss", { zone: "Europe/Moscow" });
      const slotEnd = DateTime.fromFormat(interval.end, "HH:mm:ss", { zone: "Europe/Moscow" });

      while (slotStart < slotEnd) {
        const slotTimeStr = slotStart.toFormat("HH:mm:ss");

        const busyOps = apps
          .filter(app => app.time === slotTimeStr)
          .map(app => app.operator_id);
          
        if (operators.some(op => !busyOps.includes(op))) {
          freeSlots.push(slotTimeStr);
        }

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
      if (!date) {
        return res.status(400).json({ error: "Дата не передана" });
      }

      const hours = await db("hours").first("start", "end");
      if (!hours) {
        return res.status(400).json({ error: "Интервал работы не задан" });
      }

      const applications = await db("applications")
        .where("date", date)
        .select("id", "tg_username", "time", "network", "amount", "type", "address", "operator_id");

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

