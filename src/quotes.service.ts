import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import * as moment from 'moment';
import xlsx from 'node-xlsx';
import 'dotenv/config';

const outputFolder = process.env.OUTPUT_FOLDER;
const outputPath = path.join(__dirname, '../', outputFolder, '/');
const captureTitle = process.env.CAPTURE_TITLE;
const url = process.env.URL;
const filePrefix = process.env.FILEPREFIX;

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor() {
    this.init();
  }

  async init() {
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);
    const dataList = [];
    const titleList = [];

    $('.scr_table tr')
      .eq(0)
      .find('th')
      .each(function () {
        titleList.push($(this).text());
      });
    const index = $('.limit_sale tr').index(
      $(`.limit_sale tr td:contains(${captureTitle})`).parent(),
    );
    $('.scr_table tbody tr')
      .eq(index)
      .find('td')
      .each(function () {
        dataList.push($(this).text());
      });

    const name = $('h1.name').text().split('(')[0].trim();
    const fileName = `${filePrefix}-${name}-${moment().format(
      'MM-DD-HH-mm-ss',
    )}.xlsx`;
    const outputFile = `${outputPath}${fileName}`;
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath);
    }
    fs.writeFile(
      outputFile,
      xlsx.build(
        [
          {
            name: 'sheet123',
            data: [titleList, dataList],
          },
        ],
        'utf-8',
      ),
      (err) => {
        if (err) {
          this.logger.error(err);
        } else {
          this.logger.log(`生成地址：${outputFile}`);
        }
      },
    );
  }
}
