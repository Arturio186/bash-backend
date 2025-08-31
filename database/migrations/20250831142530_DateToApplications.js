/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.table("applications", (table) => {
    table.date("date").nullable(); // дата заявки, необязательное поле
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.table("applications", (table) => {
    table.dropColumn("date");
  });
};
