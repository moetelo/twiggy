<?php
declare(strict_types=1);

namespace App;

class SomeClass
{
    public function getPerson(): Person
    {
        return new Person();
    }
}
