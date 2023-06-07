import {Base} from './base';
import {Functions} from "./functions";
import { applyMixins } from './utils';

class FunctionsKit extends Functions{}
interface FunctionsKit{}

applyMixins(FunctionsKit, [Functions]);

export default FunctionsKit;