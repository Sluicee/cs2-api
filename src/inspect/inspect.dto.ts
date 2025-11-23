import { IsString, IsOptional, IsNotEmpty, IsArray, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

export class InspectParamsDto {
    @IsOptional()
    @IsString()
    s?: string;

    @IsNotEmpty()
    @IsString()
    a: string;

    @IsNotEmpty()
    @IsString()
    d: string;

    @IsOptional()
    @IsString()
    m?: string;
}

export class BatchInspectDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InspectParamsDto)
    @ArrayMaxSize(1000, { message: 'Maximum 1000 items per batch' })
    items: InspectParamsDto[];
}
